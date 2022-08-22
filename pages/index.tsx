import type { NextPage } from 'next';

import Layout from '../src/components/Templates/Layout';
import ProductsSection from '../src/components/Templates/ProductsSection';
import RoadmapSection from '../src/components/Templates/RoadmapSection';
import ArticlesSection from '../src/components/Templates/ArticlesSection';
import AboutSection from '../src/components/Templates/AboutSection';
import Landing from '../src/components/Templates/Landing';
import BuySection from '../src/components/Templates/BuySection/BuySection';

const Home: NextPage = () => (
  <>
    <Layout>
      <Landing />
      <AboutSection id={'about'} />
      <ProductsSection id={'P2P BTC'} />
      <RoadmapSection id={'Disclaimer'} />
      <BuySection id={'buy'} />
      <SellSection id={'Sell'} />
    </Layout>
  </>
);

export default Home;
