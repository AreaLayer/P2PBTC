import { Buffer } from 'buffer';
import { bech32m } from 'bech32';
import { SpendBundle } from 'greenwebjs/util/serializer/types/spend_bundle';
import {
  CAT_V2_MOD,
  decompress_object_with_puzzles,
  NFT_OWNERSHIP_LAYER_MOD,
  NFT_STATE_LAYER_MOD,
  SETTLEMENT_PAYMENTS_MOD,
  SETTLEMENT_PAYMENTS_MOD_HASH,
  SETTLEMENT_PAYMENTS_OLD_MOD,
  SETTLEMENT_PAYMENTS_OLD_MOD_HASH,
} from '~/chia/puzzle-compression';
import { bigint_from_bytes, Bytes, int_from_bytes, SExp } from 'clvm';
import { Coin, CoinSpend, util } from 'greenwebjs';
import { ConditionsDict } from 'greenwebjs/util/sexp';
import { ConditionOpcode } from 'greenwebjs/util/sexp/condition_opcodes';
import { BigNumberish } from '@ethersproject/bignumber';

const ZERO_32 = '0000000000000000000000000000000000000000000000000000000000000000';

function created_outputs_for_conditions_dict(conditions_dict: ConditionsDict, input_coin_name: string): Coin[] {
  const output_coins = [];
  for (const cvp of conditions_dict.get(ConditionOpcode.CREATE_COIN) || []) {
    const coin = new Coin();
    coin.parentCoinInfo = input_coin_name;
    coin.puzzleHash = cvp.vars[0];
    const amount_hex = cvp.vars[1];
    coin.amount = int_from_bytes(Bytes.from(amount_hex, 'hex'));
    output_coins.push(coin);
  }
  return output_coins;
}

function additions_for_solution(name: any, puzzle_reveal: any, solution: any, max_cost: any) {
  const [err, dic, cost] = util.sexp.conditionsDictForSolution(puzzle_reveal, solution, max_cost);
  if (err || !dic) {
    return [];
  }
  return created_outputs_for_conditions_dict(dic, name);
}

function getAssetId(puzzle: SExp): string {
  const uncurriedPuzzle = util.sexp.uncurry(puzzle);
  if (uncurriedPuzzle) {
    const [mod, curriedArgs] = uncurriedPuzzle;
    if (mod.equal_to(util.sexp.SINGLETON_TOP_LAYER_v1_1_PROGRAM_MOD)) {
      const [singletonStruct, maybeNftStateLayer] = curriedArgs;
      const launcherId = singletonStruct.rest().first().atom!.hex();

      const uncurriedNftStateLayer = util.sexp.uncurry(maybeNftStateLayer);
      if (uncurriedNftStateLayer?.[0].equal_to(NFT_STATE_LAYER_MOD)) {
        return util.address.puzzleHashToAddress(launcherId, 'nft');
      }
    } else if (mod.equal_to(CAT_V2_MOD)) {
      const [_, tailHash] = curriedArgs;
      return tailHash.atom!.hex();
    }
  }
  return '';
}

function getInnerPuzzleAndSolution(
  puzzle: SExp,
  solution: SExp
): { innerPuzzle: SExp; innerSolution: SExp; assetId: string } {
  const uncurriedPuzzle = util.sexp.uncurry(puzzle);
  if (uncurriedPuzzle) {
    const [mod, curriedArgs] = uncurriedPuzzle;
    if (mod.equal_to(util.sexp.SINGLETON_TOP_LAYER_v1_1_PROGRAM_MOD)) {
      let innerSolution = solution.rest().rest().first();
      const [singletonStruct, maybeNftStateLayer] = curriedArgs;
      const launcherId = singletonStruct.rest().first().atom!.hex();

      const uncurriedNftStateLayer = util.sexp.uncurry(maybeNftStateLayer);
      if (uncurriedNftStateLayer?.[0].equal_to(NFT_STATE_LAYER_MOD)) {
        const [nft_mod_hash, metadata, metadata_updater_hash, inner_puzzle] = uncurriedNftStateLayer?.[1];
        let innerPuzzle = inner_puzzle;
        innerSolution = innerSolution.first();

        const uncurriedNftOwnershipLayer = util.sexp.uncurry(inner_puzzle);
        if (uncurriedNftOwnershipLayer?.[0].equal_to(NFT_OWNERSHIP_LAYER_MOD)) {
          const [_, current_did, transfer_program, p2_puzzle] = uncurriedNftOwnershipLayer?.[1];
          innerPuzzle = p2_puzzle;
          innerSolution = innerSolution.first();
        }

        return { assetId: util.address.puzzleHashToAddress(launcherId, 'nft'), innerPuzzle, innerSolution };
      }
    } else if (mod.equal_to(CAT_V2_MOD)) {
      const [_, tailHash, inner_puzzle] = curriedArgs;
      return { assetId: tailHash.atom!.hex(), innerPuzzle: inner_puzzle, innerSolution: solution.first() };
    }
  }
  return { assetId: '', innerPuzzle: puzzle, innerSolution: solution };
}

export class Offer {
  constructor(
    public readonly bundle: SpendBundle,
    public readonly requestedPayments: { [assetId: string]: NotarizedPayment[] }
  ) {}

  getOfferedCoins(): { [assetId: string]: Coin[] } {
    const offeredCoins: any = {};
    for (const parentSpend of this.bundle.coinSpends.filter((spend) => spend.coin.parentCoinInfo !== ZERO_32)) {
      let coins_for_this_spend: Coin[] = [];

      let name = util.coin.getName(parentSpend.coin);
      // console.log({ name, coin: parentSpend.coin });
      const additions = additions_for_solution(
        name,
        parentSpend.puzzleReveal,
        parentSpend.solution,
        util.sexp.MAX_BLOCK_COST_CLVM
      );
      // console.log({ additions });
      let { assetId, innerPuzzle, innerSolution } = getInnerPuzzleAndSolution(
        parentSpend.puzzleReveal,
        parentSpend.solution
      );
      if (assetId) {
        const conditions = util.sexp.run(innerPuzzle, innerSolution);
        const offered_amounts: BigNumberish[] = [];
        let expected_num_matches = 0;
        for (const condition of conditions.as_iter()) {
          // console.log(condition.rest().first().atom!.hex());
          // console.log([SETTLEMENT_PAYMENTS_MOD_HASH, SETTLEMENT_PAYMENTS_OLD_MOD_HASH]);
          if (
            condition.first().as_int() == 51 &&
            [SETTLEMENT_PAYMENTS_MOD_HASH, SETTLEMENT_PAYMENTS_OLD_MOD_HASH].includes(
              condition.rest().first().atom!.hex()
            )
          ) {
            expected_num_matches += 1;
            offered_amounts.push(condition.rest().rest().first().as_int());
          }
        }

        let matching_spend_additions = additions.filter((a) => offered_amounts.includes(a.amount));

        if (matching_spend_additions.length === expected_num_matches) {
          coins_for_this_spend = matching_spend_additions;
        } else {
          if (matching_spend_additions.length < expected_num_matches) {
            matching_spend_additions = additions;
          }
          matching_spend_additions = matching_spend_additions.filter((a) => {
            return [
              util.sexp.sha256tree(util.sexp.CATPuzzle(assetId, SETTLEMENT_PAYMENTS_MOD)),
              util.sexp.sha256tree(util.sexp.CATPuzzle(assetId, SETTLEMENT_PAYMENTS_OLD_MOD)),
            ].includes(a.puzzleHash);
          });

          if (matching_spend_additions.length === expected_num_matches) {
            coins_for_this_spend = matching_spend_additions;
          } else {
            throw new Error('Could not properly guess offered coins from parent spend');
          }
        }
      } else {
        coins_for_this_spend = additions.filter((addition) =>
          [SETTLEMENT_PAYMENTS_MOD_HASH, SETTLEMENT_PAYMENTS_OLD_MOD_HASH].includes(addition.puzzleHash)
        );
      }

      const removals = this.bundle.coinSpends.map((coinSpend) => util.coin.getId(coinSpend.coin));
      coins_for_this_spend = coins_for_this_spend.filter((coin) => !removals.includes(util.coin.getId(coin)));

      offeredCoins[assetId] = [...(offeredCoins[assetId] || []), ...coins_for_this_spend];
    }
    return offeredCoins;
    // return this.bundle.coinSpends.filter((spend) => spend.coin.parentCoinInfo !== ZERO_32);
  }

  static from_bech32(offer_bech32: string) {
    let data;
    try {
      data = Buffer.from(bech32m.fromWords(bech32m.decode(offer_bech32, 2147483647).words));
    } catch (e) {
      console.log(e);
    }

    if (!data) {
      throw Error('Invalid Offer');
    }

    return this.try_offer_decompression(data);
  }

  static try_offer_decompression(offer_bytes: Buffer): Offer {
    try {
      return this.from_compressed(offer_bytes);
    } catch (e) {
      console.error(e);
    }
    return this.from_bytes(offer_bytes.buffer);
  }

  static from_compressed(offer_bytes: Buffer): Offer {
    let asBytes = decompress_object_with_puzzles(offer_bytes);
    return Offer.from_bytes(asBytes);
  }

  static from_bytes(as_bytes: ArrayBufferLike): Offer {
    const bundle = util.serializer.deserialize(SpendBundle, Bytes.from(new Uint8Array(as_bytes)).hex());
    return this.from_spend_bundle(bundle);
  }

  static from_spend_bundle(bundle: SpendBundle): Offer {
    const requested_payments: { [assetId: string]: any[] } = {};
    const leftoverCoinSpends: CoinSpend[] = [];

    for (const coinSpend of bundle.coinSpends) {
      const assetId = getAssetId(coinSpend.puzzleReveal);
      if (coinSpend.coin.parentCoinInfo == ZERO_32) {
        const notarized_payments: any[] = [];
        for (const paymentGroup of coinSpend.solution.as_iter()) {
          const nonce = paymentGroup.first().atom!.hex();
          const payment_args_list: SExp[] = [...paymentGroup.rest().as_iter()];
          notarized_payments.push(
            ...payment_args_list.map((condition) => NotarizedPayment.from_condition_and_nonce(condition, nonce))
          );
        }
        requested_payments[assetId] = notarized_payments;
      } else {
        leftoverCoinSpends.push(coinSpend);
      }
    }
    const leftoverBundle = new SpendBundle();
    leftoverBundle.coinSpends = leftoverCoinSpends;
    leftoverBundle.aggregatedSignature = bundle.aggregatedSignature;
    return new Offer(leftoverBundle, requested_payments);
  }
}

export class NotarizedPayment {
  constructor(public puzzle_hash: string, public amount: BigNumberish, public memos: Bytes[], public nonce: string) {}

  static from_condition_and_nonce(condition: SExp, nonce: string) {
    const jsCondition = condition.as_javascript();
    if (!(jsCondition instanceof Array)) {
      throw new Error('Invalid condition');
    }
    const [puzzle_hash, amount] = jsCondition.slice(0, 2);
    let memos: Bytes[] = [];
    if (jsCondition.length > 2) {
      memos = jsCondition[3];
    }
    return new NotarizedPayment(puzzle_hash, bigint_from_bytes(Bytes.from(amount, 'hex')), memos, nonce);
  }
}
