import _ from 'lodash';
import {uiModules} from 'ui/modules';
import { comboBoxKeyCodes } from '@elastic/eui';

const typeahead = uiModules.get('kibana/typeahead');

typeahead.directive('kbnTypeaheadChild', function () {
  return {
    scope: false,
    require: 'kbnTypeahead',
    link: function (scope, element, attr, controller) {

      let items = [];

      controller.getItems = function() {
        let filteredItems = scope.$$childHead.filteredItems ? scope.$$childHead.filteredItems : [];
        let possibleFields = scope.possibleFields ? scope.possibleFields : [];

        possibleFields = _.difference(possibleFields, filteredItems);

        items = filteredItems.concat(possibleFields);
        return items
      };

      controller.isVisible = function (item) {
        return !controller.hidden && ((scope.$$childHead.filteredItems && scope.$$childHead.filteredItems.length > 0) ||
          (scope.possibleFields && scope.possibleFields.length > 0)) && (controller.focused || controller.mousedOver);
      };

      controller.selectItem = function (item, ev) {
        self.hidden = true;
        self.active = false;

        if (scope.possibleFields && scope.possibleFields.includes(item)) {
          const cursorPos = scope.queryBarForm.$$element[0][0].selectionEnd;
          const viewValue = scope.$$childHead.inputModel.$viewValue;
          const startIdx = viewValue.substr(0, cursorPos).lastIndexOf(' ') + 1;
          const newItem = viewValue.substr(0, startIdx) + item + viewValue.substr(cursorPos);
          scope.$$childHead.inputModel.$setViewValue(newItem);
          scope.$$childHead.inputModel.$render();
          scope.$$childHead.items = controller.history.add(item);
        } else {
          scope.$$childHead.inputModel.$setViewValue(item);
          scope.$$childHead.inputModel.$render();
          controller.persistEntry();
          if (ev && ev.type === 'click') {
            scope.$$childHead.onSelect();
          }
        }
      };

      controller.getActiveIndex = function () {
        if (!controller.active) {
          return;
        }

        return items.indexOf(controller.active);
      };

      controller.activateNext = function () {
        var index = controller.getActiveIndex();
        if (index == null) {
          index = 0;
        } else if (index < items.length - 1) {
          ++index;
        }

        controller.activateItem(items[index]);
      };

      controller.activatePrev = function () {
        var index = controller.getActiveIndex();

        if (index > 0 && index != null) {
          --index;
        } else if (index === 0) {
          controller.active = false;
          return;
        }

        controller.activateItem(items[index]);
      };

      controller.keypressHandler = function (ev) {
        const keyCode = ev.which || ev.keyCode;

        if (controller.focused) {
          controller.hidden = false;
        }

        // hide on escape
        if (_.contains([comboBoxKeyCodes.ESC], keyCode)) {
          controller.hidden = true;
          controller.active = false;
        }

        // change selection with arrow up/down
        // on down key, attempt to load all items if none are loaded
        if (_.contains([comboBoxKeyCodes.DOWN], keyCode) && scope.$$childHead.filteredItems.length === 0 && scope.possibleFields === undefined) {
          scope.$$childHead.filteredItems = $scope.items;
          scope.$$childHead.$digest();
        } else if (_.contains([comboBoxKeyCodes.UP, comboBoxKeyCodes.DOWN], keyCode)) {
          if (controller.isVisible() && (scope.$$childHead.filteredItems.length || scope.possibleFields)) {
            ev.preventDefault();

            if (keyCode === comboBoxKeyCodes.DOWN) {
              controller.activateNext();
            } else {
              controller.activatePrev();
            }
          }
        }

        // persist selection on enter, when not selecting from the list
        if (_.contains([comboBoxKeyCodes.ENTER], keyCode)) {
          if (!controller.active) {
            controller.persistEntry();
          }
        }

        // select on enter or tab
        if (_.contains([comboBoxKeyCodes.ENTER, comboBoxKeyCodes.TAB], keyCode)) {
          controller.selectActive();
          controller.hidden = true;
        }
      };

    }
}});

