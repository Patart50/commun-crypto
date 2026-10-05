import { describe, expect, it } from 'vitest';
import { dec } from './money';
import {
  addQuantity,
  amountForTarget,
  breakEvenFor,
  breakEvenPrice,
  effectivePrice,
  exposure,
  exposureFor,
  latentGain,
  latentGainFor,
  limitPrice,
  limitPriceFor,
  position,
  quantityForTarget,
} from './renfort';

const z = dec(0);

describe('Long : cohérence avec les formules en montant de renfort-crypto', () => {
  const p = position('1', '60000');
  const f = dec('0.001');

  it('quantité pour la cible × prix effectif = montant pour la cible, même PMP obtenu', () => {
    const q = quantityForTarget('long', p, dec('50000'), dec('40000'), f);
    const m = amountForTarget(p, dec('50000'), dec('40000'), f);
    if (q.status !== 'ok' || m.status !== 'ok') throw new Error('statut inattendu');
    expect(q.quantity.mul(effectivePrice('long', dec('40000'), f)).minus(m.amount).abs().lt('1e-30')).toBe(true);
    expect(q.add.after.pmp.minus('50000').abs().lt('1e-30')).toBe(true);
    expect(q.limitPrice.eq(limitPrice(dec('50000'), f))).toBe(true);
  });

  it('break-even, latent et exposition identiques aux fonctions Long', () => {
    expect(breakEvenFor('long', dec('100'), f).eq(breakEvenPrice(dec('100'), f))).toBe(true);
    expect(latentGainFor('long', p, dec('65000'), f).eq(latentGain(p, dec('65000'), f))).toBe(true);
    expect(exposureFor('long', p, dec('55000'), f).gainAfterShock.eq(exposure(p, dec('55000'), f).gainAfterShock)).toBe(true);
  });

  it('frais d’un ajout : prix effectif P ÷ (1 − f)', () => {
    const r = addQuantity('long', position('0', '0'), dec('1'), dec('99'), dec('0.01'));
    expect(r.effectivePrice.toString()).toBe('100');
    expect(r.fees.toString()).toBe('1');
    expect(r.after.pmp.toString()).toBe('100');
  });
});

describe('Short', () => {
  const p = position('2', '100');

  it('ajout : moyenne pondérée des prix de vente', () => {
    const up = addQuantity('short', p, dec('1'), dec('130'), z);
    expect(up.after.quantity.toString()).toBe('3');
    expect(up.after.pmp.toString()).toBe('110');
    expect(up.worsensPmp).toBe(false);
    expect(addQuantity('short', p, dec('2'), dec('80'), z).worsensPmp).toBe(true);
  });

  it('frais d’entrée : on encaisse P × (1 − f)', () => {
    const r = addQuantity('short', position('0', '0'), dec('1'), dec('200'), dec('0.01'));
    expect(r.effectivePrice.toString()).toBe('198');
    expect(r.fees.toString()).toBe('2');
  });

  it('quantité pour monter le PMP à la cible', () => {
    const r = quantityForTarget('short', p, dec('110'), dec('130'), z);
    if (r.status !== 'ok') throw new Error(r.status);
    expect(r.quantity.toString()).toBe('1');
    expect(r.add.after.pmp.toString()).toBe('110');
    expect(r.limitPrice.toString()).toBe('110');
  });

  it('cible atteinte, inatteignable, sans position', () => {
    expect(quantityForTarget('short', p, dec('90'), dec('130'), z).status).toBe('reached');
    expect(quantityForTarget('short', p, dec('100'), dec('130'), z).status).toBe('reached');
    const u = quantityForTarget('short', p, dec('110'), dec('105'), z);
    expect(u).toEqual({ status: 'unreachable', limitPrice: dec('110') });
    expect(quantityForTarget('short', position('0', '0'), dec('110'), dec('130'), z).status).toBe('no-position');
    // Avec frais, la limite monte : 110 ÷ 0,999.
    expect(limitPriceFor('short', dec('110'), dec('0.001')).eq(dec('110').div('0.999'))).toBe(true);
    expect(quantityForTarget('short', p, dec('110'), dec('110.05'), dec('0.001')).status).toBe('unreachable');
  });

  it('break-even, latent et exposition', () => {
    expect(breakEvenFor('short', dec('100'), dec('0.001')).eq(dec('100').div('1.001'))).toBe(true);
    expect(latentGainFor('short', p, dec('90'), z).toString()).toBe('20');
    expect(latentGainFor('short', p, dec('100'), dec('0.01')).toString()).toBe('-2');
    const e = exposureFor('short', p, dec('100'), z);
    expect(e.engaged.toString()).toBe('200');
    expect(e.gainAfterShock.toString()).toBe('-40');
    expect(e.moveToBreakEven.toString()).toBe('0');
    expect(exposureFor('short', p, dec('125'), z).moveToBreakEven.toString()).toBe('-0.2');
  });

  it('entrées invalides', () => {
    expect(() => addQuantity('short', p, dec('-1'), dec('100'), z)).toThrow(RangeError);
    expect(() => effectivePrice('short', dec('0'), z)).toThrow(RangeError);
    expect(() => effectivePrice('long', dec('100'), dec('1'))).toThrow(RangeError);
  });
});
