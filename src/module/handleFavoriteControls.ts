import { MODULE_ABBREV, MODULE_ID, MyFlags, MySettings } from './constants';
import { log, getActivationType, isActiveItem } from './helpers';

export function addFavoriteControls(
  app: Application & {
    object: Actor5eCharacter;
  },
  html: JQuery,
  data: ActorSheet5eCharacterSheetData
) {
  function createFavButton(filterOverride: boolean) {
    return `<a class="item-control item-action-filter-override ${filterOverride ? 'included' : ''}" title="${
      filterOverride
        ? game.i18n.localize(`${MODULE_ABBREV}.button.setOverrideFalse`)
        : game.i18n.localize(`${MODULE_ABBREV}.button.setOverrideTrue`)
    }"><i class="fas ${filterOverride ? 'fa-star' : 'fa-sign-in-alt'}"></i> <span class="control-label">${
      filterOverride
        ? game.i18n.localize(`${MODULE_ABBREV}.button.setOverrideFalse`)
        : game.i18n.localize(`${MODULE_ABBREV}.button.setOverrideTrue`)
    }</span></a>`;
  }

  // add button to toggle favourite of the item in their native tab
  if (app.options.editable) {
    // Handle Click on our action
    $(html).on('click', 'a.item-action-filter-override', (e) => {
      try {
        const closestItemLi = $(e.target).parents('[data-item-id]')[0]; // BRITTLE
        const itemId = closestItemLi.dataset.itemId;
        const relevantItem = app.object.items.get(itemId);
        const existingFilterOverride = relevantItem.getFlag(MODULE_ID, MyFlags.filterOverride);

        // set the flag to be the opposite of what it is now
        relevantItem.setFlag(MODULE_ID, MyFlags.filterOverride, !existingFilterOverride);

        log(false, 'a.item-action-filter-override click registered', {
          closestItemLi,
          itemId,
          relevantItem,
          existingFilterOverride,
        });
      } catch (e) {
        log(true, 'Error trying to set flag on item', e);
      }
    });

    // Add button to all item rows
    html.find('[data-item-id]').each((_index, element: HTMLElement) => {
      const itemId = element.dataset.itemId;

      const relevantItem = app.object.items.get(itemId);

      const filterOverride = relevantItem.getFlag(MODULE_ID, MyFlags.filterOverride);

      log(false, { itemId, filterOverride });

      $(element).find('.item-controls').append(createFavButton(filterOverride));
    });
  }
}

// if (app.options.editable) {
//   html.find('.spellbook .item-controls').css('flex', '0 0 88px');
//   html.find('.inventory .item-controls').css('flex', '0 0 88px');
//   html.find('.features .item-controls').css('flex', '0 0 66px');
//   html.find('.favourite .item-controls').css('flex', '0 0 22px');
// }
