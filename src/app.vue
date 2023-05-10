<template lang="pug">
.main
  .address(:class="{ valid: isValidSuiAddress(path) }") {{ path }}
  .tokens
    .token(v-for="token in tokens")
      .name {{ token.name }}
      .balance {{ token.value }}$
  .value {{ balance }}$
</template>

<script setup>
import BN from 'bignumber.js';
import { get_tokens } from './sui.js';
import { ref, watchEffect, computed } from 'vue';
import { useRoute } from 'vue-router';
import { isValidSuiAddress } from '@mysten/sui.js';

const tokens = ref('');
const balance = ref('');
const route = useRoute();
const path = computed(() => route.path.slice(1));

watchEffect(async () => {
  if (isValidSuiAddress(path.value)) {
    const amounts = await get_tokens(path.value);
    const response = await fetch(
      `https://api.dexscreener.com/latest/dex/tokens/${Object.keys(
        amounts
      ).join(',')}`
    );
    const { pairs } = await response.json();
    const seen_addresses = new Set();
    const unique_pairs = pairs
      .filter(
        ({ chainId, baseToken: { address } }) =>
          chainId === 'sui' && Object.keys(amounts).includes(address)
      )
      .filter(({ baseToken: { address } }) => {
        if (seen_addresses.has(address)) return false;
        seen_addresses.add(address);
        return true;
      });

    tokens.value = unique_pairs.map(
      ({ baseToken: { address, symbol }, priceUsd }) => ({
        address,
        name: symbol,
        value: new BN(amounts[address]).multipliedBy(priceUsd).decimalPlaces(2),
      })
    );

    balance.value = tokens.value.reduce(
      (sum, { value }) => value.plus(sum),
      new BN(0)
    );
  }
});
</script>

<style lang="stylus">
@font-face
  font-family "nimbus-sans"
  src url("assets/nimbus-sans.bold.otf") format("otf");

:root
  --light-shadow: 0 5px 15px rgba(145, 160, 180, 0.15)
  --dark-shadow: 0 -5px 15px rgba(145, 160, 180, 0.15)
  --background: #e0e0e0
  --text-color: #333

.main
  display: flex
  flex-direction: column
  justify-content: center
  align-items: center
  height: 100vh
  background: var(--background)
  width 100vw
  overflow: hidden
  .address
    text-align center
    color: var(--text-color)
    text-shadow: var(--dark-shadow)
    font-size: .9rem
    margin-bottom: 1em
    padding: 1em 0
    border-radius: 1em
    width 100vw
    &.valid
      color: #2ECC71
  .value
    color: var(--text-color)
    text-shadow: var(--dark-shadow)
    font-size: 1.2rem
    padding: 1em

  .tokens
    display flex
    flex-flow column nowrap
    .token
      display grid
      align-items baseline
      grid "name value" 1fr / 150px 150px
      padding .5em 1em
      margin 1em 0
      background: var(--background)
      box-shadow: var(--light-shadow), var(--dark-shadow)
      text-shadow: var(--dark-shadow)
      border-radius 10px
      .name
        padding-right 1em
        text-align right
        font-weight 900
        font-size .8em
        opacity .8
      .balance
        color #8E44AD


body, html
  height: 100%
  margin: 0
  padding: 0
  font-family: 'Raleway', sans-serif
  background: var(--background)
  color: var(--text-color)
</style>
