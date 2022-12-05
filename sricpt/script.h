
// Copyright (c) 2009-2010 Satoshi Nakamoto
// Copyright (c) 2009-2020 The Bitcoin Core developers
// Distributed under the MIT software license, see the accompanying
// file COPYING or http://www.opensource.org/licenses/mit-license.php.

#ifndef BITCOIN_SCRIPT_SCRIPT_H
#define BITCOIN_SCRIPT_SCRIPT_H


#include <crypto/common.h>
#include <prevector.h>
#include <serialize.h>

#include <assert.h>
#include <climits>
#include <limits>
#include <stdexcept>
#include <stdint.h>
#include <string.h>
#include <string>
#include <uint256.h>
#include <vector>

enum opcodetype
{

// crypto
  
OP_RELALTIVETIME
OP_NLOCKTIME
OP_LOCKTIME
  }
