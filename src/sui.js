import { JsonRpcProvider, Connection } from '@mysten/sui.js';
import BN from 'bignumber.js';

const provider = new JsonRpcProvider(
  new Connection({ fullnode: 'http://178.250.189.106:9000' })
);

export async function get_tokens(owner) {
  const coins = await provider.getAllBalances({ owner });
  const metas = await Promise.all(
    coins.map(async ({ coinType, totalBalance }) => ({
      type: coinType,
      balance: totalBalance,
      decimals: await provider
        .getCoinMetadata({ coinType })
        .then(({ decimals }) => decimals),
    }))
  );
  return metas.reduce(
    (result, { type, balance, decimals }) => ({
      ...result,
      [type]: new BN(balance).div(10 ** decimals).toString(),
    }),
    {}
  );
}
