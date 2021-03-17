import { MODULE_ID, MyFlags, MySettings } from './constants';
import { log, getActivationType, isActiveItem } from './helpers';

export function getActorActionsData(actor: Actor5eCharacter) {
  // within each activation time, we want to display: Items which do damage, Spells which do damage, Features
  // MUTATED
  // const actionsData: Record<ActivationType5e, Set<Partial<Item5e>>> = {
  //   action: new Set(),
  //   bonus: new Set(),
  //   reaction: new Set(),
  //   special: new Set(),
  // };

  log(false, {
    actor,
    someItems: actor.items.filter((item: Item5e) => !!item.data.name),
  });

  const actionsData: Record<ActivationType5e, Set<Partial<Item5e>>> = actor.items.reduce(
    (acc, item: Item5e) => {
      try {
        log(false, 'digesting item', {
          item,
        });
        const override = item.getFlag(MODULE_ID, MyFlags.filterOverride);

        // ignore this if the override hasn't been set
        if (override !== undefined) {
          log(false, 'flag filter override', {
            item,
            override,
          });

          // if override is specifically set to true, add the item to the actions list
          if (override) {
            const activationType = getActivationType(item.data.data.activation?.type);

            acc[activationType].add(item);
          }

          return acc;
        }

        // switch filters items we don't want in the acc
        switch (item.type) {
          case 'weapon': {
            if (!item.data.data.equipped) {
              return acc;
            }
            break;
          }
          case 'equipment': {
            if (!item.data.data.equipped || !isActiveItem(item.data.data.activation?.type)) {
              return acc;
            }
            break;
          }
          case 'consumable': {
            if (
              !game.settings.get(MODULE_ID, MySettings.includeConsumables) ||
              !isActiveItem(item.data.data.activation?.type)
            ) {
              return acc;
            }
            break;
          }
          case 'spell': {
            const limitToCantrips = game.settings.get(MODULE_ID, MySettings.limitActionsToCantrips);

            const isPrepared = item.data.data.preparation?.mode === 'always' || item.data.data.preparation?.prepared;

            const isCantrip = item.data.data.level === 0;

            if (!isCantrip && (limitToCantrips || !isPrepared)) {
              return acc;
            }

            const isReaction = item.data.data.activation?.type === 'reaction';
            const isBonusAction = item.data.data.activation?.type === 'bonus';

            //ASSUMPTION: If the spell causes damage, it will have damageParts
            const isDamageDealer = item.data.data.damage?.parts?.length > 0;
            const isOneMinuter = item.data.data?.duration?.units === 'minute' && item.data.data?.duration?.value === 1;

            let shouldInclude = isReaction || isBonusAction || isDamageDealer;

            if (game.settings.get(MODULE_ID, MySettings.includeOneMinuteSpells)) {
              shouldInclude = shouldInclude || isOneMinuter;
            }

            if (!shouldInclude) {
              return acc;
            }
            break;
          }
          case 'feat': {
            if (!item.data.data.activation?.type) {
              return acc;
            }
            break;
          }
          default: {
            return acc;
          }
        }

        const activationType = getActivationType(item.data.data.activation?.type);

        acc[activationType].add(item);
        return acc;
      } catch (e) {
        log(true, 'error trying to digest item', item.name, e);
        return acc;
      }
    },
    {
      action: new Set(),
      bonus: new Set(),
      reaction: new Set(),
      other: new Set(),
    }
  );

  return actionsData;
}

// try {
//   // digest all weapons and equipment that are equipped populate the actionsData appropriate categories
//   const equippedWeapons: Item5e[] =
//     actor.items.filter((item: Item5e) => item.type === 'weapon' && item.data.data.equipped) || [];

//   log(false, {
//     equippedWeapons,
//   });

//   // MUTATES actionsData
//   equippedWeapons.forEach((item) => {
//     const activationType = getActivationType(item.data.data.activation?.type);

//     actionsData[activationType].add(item);
//   });
// } catch (e) {
//   log(true, 'error trying to digest weapons', e);
// }

// try {
//   // digest all weapons and equipment that are equipped populate the actionsData appropriate categories
//   const equippedEquipment: Item5e[] =
//     actor.items.filter(
//       (item: Item5e) =>
//         item.type === 'equipment' && item.data.data.equipped && isActiveItem(item.data.data.activation?.type)
//     ) || [];

//   log(false, {
//     equippedEquipment,
//   });

//   // MUTATES actionsData
//   equippedEquipment.forEach((item) => {
//     const activationType = getActivationType(item.data.data.activation?.type);

//     actionsData[activationType].add(item);
//   });
// } catch (e) {
//   log(true, 'error trying to digest equipment', e);
// }

// if (game.settings.get(MODULE_ID, MySettings.includeConsumables)) {
//   try {
//     // digest all weapons and equipment that are equipped populate the actionsData appropriate categories
//     const activeConsumables: Item5e[] =
//       actor.items.filter(
//         (item: Item5e) => item.type === 'consumable' && isActiveItem(item.data.data.activation?.type)
//       ) || [];

//     log(false, {
//       activeConsumables,
//     });

//     // MUTATES actionsData
//     activeConsumables.forEach((item) => {
//       const activationType = getActivationType(item.data.data.activation?.type);

//       actionsData[activationType].add(item);
//     });
//   } catch (e) {
//     log(true, 'error trying to digest equipment', e);
//   }
// }

// try {
//   // digest all prepared spells and populate the actionsData appropriate categories
//   // MUTATES actionsData

//   const preparedSpells: Item5e[] = actor.items.filter((item: Item5e) => {
//     const isSpell = item.type === 'spell';
//     const isPrepared = item.data.data.preparation?.mode === 'always' || item.data.data.preparation?.prepared;

//     if (game.settings.get(MODULE_ID, MySettings.limitActionsToCantrips)) {
//       return isSpell && isPrepared && item.data.data.level === 0;
//     }

//     return isSpell && isPrepared;
//   });

//   const relevantSpells = preparedSpells.filter((spell) => {
//     const isReaction = spell.data.data.activation?.type === 'reaction';
//     const isBonusAction = spell.data.data.activation?.type === 'bonus';

//     //ASSUMPTION: If the spell causes damage, it will have damageParts
//     const isDamageDealer = spell.data.data.damage?.parts?.length > 0;
//     const isOneMinuter = spell.data.data?.duration?.units === 'minute' && spell.data.data?.duration?.value === 1;

//     if (game.settings.get(MODULE_ID, MySettings.includeOneMinuteSpells)) {
//       return isReaction || isBonusAction || isDamageDealer || isOneMinuter;
//     }

//     return isReaction || isBonusAction || isDamageDealer;
//   });

//   relevantSpells.forEach((spell) => {
//     const activationType = getActivationType(spell.data.data.activation?.type);

//     actionsData[activationType].add(spell);
//   });
// } catch (e) {
//   log(true, 'error trying to digest spellbook', e);
// }

// try {
//   const activeFeatures: Item5e[] = actor.items.filter((item: Item5e) => {
//     return item.type === 'feat' && item.data.data.activation?.type !== '';
//   });

//   // MUTATES actionsData
//   activeFeatures.forEach((item) => {
//     const activationType = getActivationType(item.data.data.activation?.type);

//     actionsData[activationType].add(item);
//   });
// } catch (e) {
//   log(true, 'error trying to digest features', e);
// }

// try {
//   const filterOverrides: Item5e[] = actor.items.filter((item: Item5e) => {
//     return item.getFlag(MODULE_ID, MyFlags.filterOverride) !== undefined;
//   });

//   // MUTATES actionsData
//   filterOverrides.forEach((item) => {
//     const activationType = getActivationType(item.data.data.activation?.type);

//     if (item.getFlag(MODULE_ID, MyFlags.filterOverride)) {
//       actionsData[activationType].add(item);
//     } else {
//       actionsData[activationType].delete(item);
//     }
//   });
// } catch (e) {
//   log(true, 'error trying to digest features', e);
// }
