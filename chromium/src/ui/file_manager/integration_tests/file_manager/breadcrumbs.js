// Copyright 2019 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.
/**
 * @fileoverview Tests that breadcrumbs work.
 */

import {createNestedTestFolders, ENTRIES, getCaller, getUserActionCount, pending, repeatUntil, RootPath, sendTestMessage, TestEntryInfo} from '../test_util.js';
import {testcase} from '../testcase.js';

import {remoteCall, setupAndWaitUntilReady} from './background.js';
import {DirectoryTreePageObject} from './page_objects/directory_tree.js';

async function getBreadcrumbTagName() {
  return 'xf-breadcrumb';
}

// @ts-ignore: error TS4111: Property 'breadcrumbsNavigate' comes from an index
// signature, so it must be accessed with ['breadcrumbsNavigate'].
testcase.breadcrumbsNavigate = async () => {
  const files = [ENTRIES.hello, ENTRIES.photos];
  // @ts-ignore: error TS2345: Argument of type '(TestEntryInfo | undefined)[]'
  // is not assignable to parameter of type 'TestEntryInfo[]'.
  const appId = await setupAndWaitUntilReady(RootPath.DOWNLOADS, files, []);

  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to Downloads/photos.
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath('/My files/Downloads/photos');

  // Use the breadcrumbs to navigate back to Downloads.
  await remoteCall.waitAndClickElement(
      appId, [breadcrumbsTag, 'button:nth-last-of-type(2)']);

  // Wait for the contents of Downloads to load again.
  // @ts-ignore: error TS2345: Argument of type '(TestEntryInfo | undefined)[]'
  // is not assignable to parameter of type 'TestEntryInfo[]'.
  await remoteCall.waitForFiles(appId, TestEntryInfo.getExpectedRows(files));

  // A user action should have been recorded for the breadcrumbs.
  chrome.test.assertEq(
      1, await getUserActionCount('FileBrowser.ClickBreadcrumbs'));
};

/**
 * Tests that Downloads is translated in the breadcrumbs.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsDownloadsTranslation' comes
// from an index signature, so it must be accessed with
// ['breadcrumbsDownloadsTranslation'].
testcase.breadcrumbsDownloadsTranslation = async () => {
  // Switch UI to Portuguese (Portugal).
  await sendTestMessage({name: 'switchLanguage', language: 'pt-PT'});

  // Open Files app.
  const appId =
      await setupAndWaitUntilReady(RootPath.DOWNLOADS, [ENTRIES.photos], []);

  // Check the breadcrumbs for Downloads:
  // Os meu ficheiros => My files.
  // Transferências => Downloads (as in Transfers).
  const path =
      await remoteCall.callRemoteTestUtil('getBreadcrumbPath', appId, []);
  chrome.test.assertEq('/Os meus ficheiros/Transferências', path);

  // Expand Downloads folder.
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.expandTreeItemByPath('/Downloads');

  // Navigate to Downloads/photos.
  await directoryTree.selectItemByPath('/Downloads/photos');

  // Wait and check breadcrumb translation.
  await remoteCall.waitUntilCurrentDirectoryIsChanged(
      appId, '/Os meus ficheiros/Transferências/photos');
};

/**
 * Tests that the breadcrumbs correctly render a short (3 component) path.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsRenderShortPath' comes from an
// index signature, so it must be accessed with ['breadcrumbsRenderShortPath'].
testcase.breadcrumbsRenderShortPath = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(1);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Check: the breadcrumb element should have a |path| attribute.
  const breadcrumbElement =
      await remoteCall.waitForElement(appId, [breadcrumbsTag]);
  const path = breadcrumb.slice(1);  // remove leading "/" char
  // @ts-ignore: error TS4111: Property 'path' comes from an index signature, so
  // it must be accessed with ['path'].
  chrome.test.assertEq(path, breadcrumbElement.attributes.path);

  // Check: some of the main breadcrumb buttons should be visible.
  const buttons = [breadcrumbsTag, 'button'];
  const elements = await remoteCall.callRemoteTestUtil(
      'deepQueryAllElements', appId, [buttons]);
  chrome.test.assertEq(3, elements.length);

  // Check: the main button text should be the path components.
  chrome.test.assertEq('My files', elements[0].text);
  chrome.test.assertEq('Downloads', elements[1].text);
  chrome.test.assertEq('nested-folder0', elements[2].text);

  // Check: the "last" main button should be disabled.
  chrome.test.assertEq(undefined, elements[0].attributes.disabled);
  chrome.test.assertEq(undefined, elements[1].attributes.disabled);
  chrome.test.assertEq('', elements[2].attributes.disabled);

  // Check: the breadcrumb elider button should not exist.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitForElementLost(appId, eliderButton);
};

/**
 * Tests that short breadcrumbs paths (of 4 or fewer components) should not
 * be rendered elided. The elider button not exist.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsEliderButtonNotExist' comes
// from an index signature, so it must be accessed with
// ['breadcrumbsEliderButtonNotExist'].
testcase.breadcrumbsEliderButtonNotExist = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(2);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Check: the breadcrumb element should have a |path| attribute.
  const breadcrumbElement =
      await remoteCall.waitForElement(appId, [breadcrumbsTag]);
  const path = breadcrumb.slice(1);  // remove leading "/" char
  // @ts-ignore: error TS4111: Property 'path' comes from an index signature, so
  // it must be accessed with ['path'].
  chrome.test.assertEq(path, breadcrumbElement.attributes.path);

  // Check: all of the main breadcrumb buttons should be visible.
  const buttons = [breadcrumbsTag, 'button'];
  const elements = await remoteCall.callRemoteTestUtil(
      'deepQueryAllElements', appId, [buttons]);
  chrome.test.assertEq(4, elements.length);

  // Check: the main button text should be the path components.
  chrome.test.assertEq('My files', elements[0].text);
  chrome.test.assertEq('Downloads', elements[1].text);
  chrome.test.assertEq('nested-folder0', elements[2].text);
  chrome.test.assertEq('nested-folder1', elements[3].text);

  // Check: the "last" main button should be disabled.
  chrome.test.assertEq(undefined, elements[0].attributes.disabled);
  chrome.test.assertEq(undefined, elements[1].attributes.disabled);
  chrome.test.assertEq(undefined, elements[2].attributes.disabled);
  chrome.test.assertEq('', elements[3].attributes.disabled);

  // Check: the breadcrumb elider button should not exist.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitForElementLost(appId, eliderButton);
};

/**
 * Tests that the breadcrumbs correctly render a long (5 component) path.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsRenderLongPath' comes from an
// index signature, so it must be accessed with ['breadcrumbsRenderLongPath'].
testcase.breadcrumbsRenderLongPath = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(3);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Check: the breadcrumb element should have a |path| attribute.
  const breadcrumbElement =
      await remoteCall.waitForElement(appId, [breadcrumbsTag]);
  const path = breadcrumb.slice(1);  // remove leading "/" char
  // @ts-ignore: error TS4111: Property 'path' comes from an index signature, so
  // it must be accessed with ['path'].
  chrome.test.assertEq(path, breadcrumbElement.attributes.path);

  // Check: some of the main breadcrumb buttons should be visible.
  const buttons = [breadcrumbsTag, 'button[id]'];
  const elements = await remoteCall.callRemoteTestUtil(
      'deepQueryAllElements', appId, [buttons]);
  chrome.test.assertEq(3, elements.length);

  // Check: main button text should be the non-elided path components.
  chrome.test.assertEq('My files', elements[0].text);
  chrome.test.assertEq('nested-folder1', elements[1].text);
  chrome.test.assertEq('nested-folder2', elements[2].text);

  // Check: the "last" main button should be disabled.
  chrome.test.assertEq(undefined, elements[0].attributes.disabled);
  chrome.test.assertEq(undefined, elements[1].attributes.disabled);
  chrome.test.assertEq('', elements[2].attributes.disabled);

  // Check: the breadcrumb elider button should be shown.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitForElement(appId, eliderButton);
};

/**
 * Tests that clicking a main breadcumb button makes the app navigate and
 * update the breadcrumb to that item.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsMainButtonClick' comes from an
// index signature, so it must be accessed with ['breadcrumbsMainButtonClick'].
testcase.breadcrumbsMainButtonClick = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(2);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Check: the breadcrumb path attribute should be |breadcrumb|.
  const breadcrumbElement =
      await remoteCall.waitForElement(appId, [breadcrumbsTag]);
  const path = breadcrumb.slice(1);  // remove leading "/" char
  // @ts-ignore: error TS4111: Property 'path' comes from an index signature, so
  // it must be accessed with ['path'].
  chrome.test.assertEq(path, breadcrumbElement.attributes.path);

  // Click the "second" main breadcrumb button (2nd path component).
  await remoteCall.waitAndClickElement(
      appId, [breadcrumbsTag, 'button[id="second"]']);

  // Check: the breadcrumb path should be updated due to navigation.
  await remoteCall.waitForElement(
      appId, [`${breadcrumbsTag}[path="My files/Downloads"]`]);
};

/**
 * Tests that an Enter key on a main breadcumb button item makes the app
 * navigate and update the breadcrumb to that item.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsMainButtonEnterKey' comes from
// an index signature, so it must be accessed with
// ['breadcrumbsMainButtonEnterKey'].
testcase.breadcrumbsMainButtonEnterKey = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(2);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Check: the breadcrumb path attribute should be |breadcrumb|.
  const breadcrumbElement =
      await remoteCall.waitForElement(appId, [breadcrumbsTag]);
  const path = breadcrumb.slice(1);  // remove leading "/" char
  // @ts-ignore: error TS4111: Property 'path' comes from an index signature, so
  // it must be accessed with ['path'].
  chrome.test.assertEq(path, breadcrumbElement.attributes.path);

  // Send an Enter key to the "second" main breadcrumb button.
  const secondButton = [breadcrumbsTag, 'button[id="second"]'];
  const enterKey = [secondButton, 'Enter', false, false, false];
  chrome.test.assertTrue(
      await remoteCall.callRemoteTestUtil('fakeKeyDown', appId, enterKey));

  // Check: the breadcrumb path should be updated due to navigation.
  await remoteCall.waitForElement(
      appId, [`${breadcrumbsTag}[path="My files/Downloads"]`]);
};

/**
 * Tests that a breadcrumbs elider button click opens its drop down menu and
 * that clicking the button again, closes the drop down menu.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsEliderButtonClick' comes from
// an index signature, so it must be accessed with
// ['breadcrumbsEliderButtonClick'].
testcase.breadcrumbsEliderButtonClick = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(3);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Click the breadcrumb elider button when it appears.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitAndClickElement(appId, eliderButton);

  // Check: the elider button drop-down menu should open.
  const menu = [breadcrumbsTag, '#elider-menu', 'dialog[open]'];
  await remoteCall.waitForElement(appId, menu);

  // Check: the drop-down menu should contain 2 elided items.
  const menuItems = [breadcrumbsTag, '#elider-menu .dropdown-item'];
  const elements = await remoteCall.callRemoteTestUtil(
      'deepQueryAllElements', appId, [menuItems]);
  chrome.test.assertEq(2, elements.length);

  // Check: the menu item text should be the elided path components.
  chrome.test.assertEq('Downloads', elements[0].text);
  chrome.test.assertEq('nested-folder0', elements[1].text);

  // Check: the elider button should not have the focus.
  const eliderFocus = [breadcrumbsTag, '[elider]:focus'];
  await remoteCall.waitForElementLost(appId, eliderFocus);

  // Click the elider button.
  await remoteCall.waitAndClickElement(appId, eliderButton);

  // Check: the elider button drop-down menu should close.
  await remoteCall.waitForElementLost(appId, menu);

  // Check: the focus should return to the elider button.
  await remoteCall.waitForElement(appId, eliderFocus);
};

/**
 * Tests that pressing Enter key on the breadcrumbs elider button opens its
 * drop down menu, then pressing Escape key closes the drop down menu.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsEliderButtonKeyboard' comes
// from an index signature, so it must be accessed with
// ['breadcrumbsEliderButtonKeyboard'].
testcase.breadcrumbsEliderButtonKeyboard = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(4);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Wait for the breadcrumb elider button to appear.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitForElement(appId, eliderButton);

  // Send an Enter key to the breadcrumb elider button.
  const enterKey = [eliderButton, 'Enter', false, false, false];
  chrome.test.assertTrue(
      await remoteCall.callRemoteTestUtil('fakeKeyDown', appId, enterKey));

  // Check: the elider button drop-down menu should open.
  const menu = [breadcrumbsTag, '#elider-menu', 'dialog[open]'];
  await remoteCall.waitForElement(appId, menu);

  // Check: the drop-down menu should contain 3 elided items.
  const menuItems = [breadcrumbsTag, '#elider-menu .dropdown-item'];
  const elements = await remoteCall.callRemoteTestUtil(
      'deepQueryAllElements', appId, [menuItems]);
  chrome.test.assertEq(3, elements.length);

  // Check: the menu item text should be the elided path components.
  chrome.test.assertEq('Downloads', elements[0].text);
  chrome.test.assertEq('nested-folder0', elements[1].text);
  chrome.test.assertEq('nested-folder1', elements[2].text);

  // Check: the elider button should not have the focus.
  const eliderFocus = [breadcrumbsTag, '[elider]:focus'];
  await remoteCall.waitForElementLost(appId, eliderFocus);

  // Send an Escape key to the drop-down menu.
  const escKey = [menu, 'Escape', false, false, false];
  chrome.test.assertTrue(
      await remoteCall.callRemoteTestUtil('fakeKeyDown', appId, escKey));

  // Check: the elider button drop-down menu should close.
  await remoteCall.waitForElementLost(appId, menu);

  // Check: the focus should return to the elider button.
  await remoteCall.waitForElement(appId, eliderFocus);
};

/**
 * Tests that clicking outside the elider button drop down menu makes that
 * drop down menu close.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsEliderMenuClickOutside' comes
// from an index signature, so it must be accessed with
// ['breadcrumbsEliderMenuClickOutside'].
testcase.breadcrumbsEliderMenuClickOutside = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(5);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Click the breadcrumb elider button when it appears.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitAndClickElement(appId, eliderButton);

  // Check: the elider button drop-down menu should open.
  const menu = [breadcrumbsTag, '#elider-menu', 'dialog[open]'];
  await remoteCall.waitForElement(appId, menu);

  // Click somewhere outside the drop down menu.
  await remoteCall.simulateUiClick(appId, '#file-list');

  // Check: the elider button drop-down menu should close.
  await remoteCall.waitForElementLost(appId, menu);
};

/**
 * Tests that clicking an elider button drop down menu item makes the app
 * navigate and update the breadcrumb to that item.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsEliderMenuItemClick' comes
// from an index signature, so it must be accessed with
// ['breadcrumbsEliderMenuItemClick'].
testcase.breadcrumbsEliderMenuItemClick = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(3);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Check: the breadcrumb path attribute should be |breadcrumb|.
  const breadcrumbElement =
      await remoteCall.waitForElement(appId, [breadcrumbsTag]);
  const path = breadcrumb.slice(1);  // remove leading "/" char
  // @ts-ignore: error TS4111: Property 'path' comes from an index signature, so
  // it must be accessed with ['path'].
  chrome.test.assertEq(path, breadcrumbElement.attributes.path);

  // Click the breadcrumb elider button when it appears.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitAndClickElement(appId, eliderButton);

  // Check: the elider button drop-down menu should open.
  const menu = [breadcrumbsTag, '#elider-menu', 'dialog[open]'];
  await remoteCall.waitForElement(appId, menu);

  // Check: the drop-down menu should contain 2 elided items.
  const menuItems = [breadcrumbsTag, '#elider-menu .dropdown-item'];
  const elements = await remoteCall.callRemoteTestUtil(
      'deepQueryAllElements', appId, [menuItems]);
  chrome.test.assertEq(2, elements.length);

  // Check: the menu item text should be the elided path components.
  chrome.test.assertEq('Downloads', elements[0].text);
  chrome.test.assertEq('nested-folder0', elements[1].text);

  // Click the first drop-down menu item.
  const item = [breadcrumbsTag, '#elider-menu button:first-child'];
  await remoteCall.waitAndClickElement(appId, item);

  // Check: the elider button drop-down menu should close.
  await remoteCall.waitForElementLost(appId, menu);

  // Check: the breadcrumb path should be updated due to navigation.
  await remoteCall.waitForElement(
      appId, [`${breadcrumbsTag}[path="My files/Downloads"]`]);
};

/**
 * Tests that a <shift>-Tab key on the elider button drop down menu closes
 * the menu and focuses button#first to the left of the elider button.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsEliderMenuItemTabLeft' comes
// from an index signature, so it must be accessed with
// ['breadcrumbsEliderMenuItemTabLeft'].
testcase.breadcrumbsEliderMenuItemTabLeft = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(3);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Click the breadcrumb elider button when it appears.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitAndClickElement(appId, eliderButton);

  // Check: the elider button drop-down menu should open.
  const menu = [breadcrumbsTag, '#elider-menu', 'dialog[open]'];
  await remoteCall.waitForElement(appId, menu);

  // Dispatch a <shift>-Tab key to the drop-down menu.
  const result = await sendTestMessage(
      {name: 'dispatchTabKey', /* key modifier */ shift: true});
  chrome.test.assertEq(
      result, 'tabKeyDispatched', 'shift-Tab key dispatch failure');

  // Check: the elider button drop-down menu should close.
  await remoteCall.waitForElementLost(appId, menu);

  // Check: the "first" main button should be focused.
  await remoteCall.waitForElement(
      appId, [breadcrumbsTag, 'button[id="first"]:focus']);
};

/**
 * Tests that a Tab key on the elider button drop down menu closes the menu
 * and focuses button#second to the right of the elider button.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsEliderMenuItemTabRight' comes
// from an index signature, so it must be accessed with
// ['breadcrumbsEliderMenuItemTabRight'].
testcase.breadcrumbsEliderMenuItemTabRight = async () => {
  // Build an array of nested folder test entries.
  const nestedFolderTestEntries = createNestedTestFolders(3);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);
  const breadcrumbsTag = await getBreadcrumbTagName();

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // Click the breadcrumb elider button when it appears.
  const eliderButton = [breadcrumbsTag, '[elider]'];
  await remoteCall.waitAndClickElement(appId, eliderButton);

  // Check: the elider button drop-down menu should open.
  const menu = [breadcrumbsTag, '#elider-menu', 'dialog[open]'];
  await remoteCall.waitForElement(appId, menu);

  // Dispatch a Tab key to the drop-down menu.
  const result = await sendTestMessage(
      {name: 'dispatchTabKey', /* key modifier */ shift: false});
  chrome.test.assertEq(result, 'tabKeyDispatched', 'Tab key dispatch failure');

  // Check: the elider button drop-down menu should close.
  await remoteCall.waitForElementLost(appId, menu);

  // Check: the "second" main button should be focused.
  await remoteCall.waitForElement(
      appId, [breadcrumbsTag, 'button[id="second"]:focus']);
};

/**
 * Tests that when the breadcrumbs + action bar buttons exceed the available
 * viewport width, their width is updated to fit the space instead of exceeding
 * the viewport and having some of the action bar buttons not visible.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbsDontExceedAvailableViewport'
// comes from an index signature, so it must be accessed with
// ['breadcrumbsDontExceedAvailableViewport'].
testcase.breadcrumbsDontExceedAvailableViewport = async () => {
  const nestedFolderTestEntries = createNestedTestFolders(2);

  // Open FilesApp on Downloads containing the test entries.
  const appId = await setupAndWaitUntilReady(
      RootPath.DOWNLOADS, nestedFolderTestEntries, []);

  // Get the current window width and height.
  const appWindow = await remoteCall.getWindows();
  const {outerWidth, outerHeight} = appWindow[appId];

  // Get the spacer with between breadcrumbs and action bar buttons, this
  // indicates the available space we can resize the window before the text in
  // the breadcrumb is clamped.
  const spacerWidth = await remoteCall.waitForElementStyles(
      appId, 'div.dialog-header > .spacer', ['width']);

  // Shrink the window by the available spacer width -10px to ensure the
  // breadcrumbs don't start clamping text.
  // @ts-ignore: error TS18048: 'spacerWidth.renderedWidth' is possibly
  // 'undefined'.
  const newWindowWidth = outerWidth - spacerWidth.renderedWidth + 10;
  chrome.test.assertTrue(await remoteCall.callRemoteTestUtil(
      'resizeWindow', appId, [newWindowWidth, outerHeight]));

  // Wait for the window to resize.
  await remoteCall.waitForWindowGeometry(appId, newWindowWidth, outerHeight);

  // Identify the current width of the dialog header, this is the expected
  // width when navigating to a long folder name after layout calculation.
  const expectedDialogHeaderWidth = await remoteCall.waitForElementStyles(
      appId, 'div.dialog-header', ['width']);

  // Navigate to deepest folder.
  const breadcrumb = '/My files/Downloads/' +
      nestedFolderTestEntries.map(e => e.nameText).join('/');
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.navigateToPath(breadcrumb);

  // The relayout occurs asynchronously, so there's a chance after navigating
  // to the directory the below calculation occurs prior to the relayout
  // happening, repeat until the values agree with each other.
  const caller = getCaller();
  // @ts-ignore: error TS7030: Not all code paths return a value.
  await repeatUntil(async () => {
    const actualDialogHeaderWidth = await remoteCall.waitForElementStyles(
        appId, 'div.dialog-header', ['width']);
    if (expectedDialogHeaderWidth.renderedWidth !==
        actualDialogHeaderWidth.renderedWidth) {
      return pending(
          caller, 'Expected dialog header width is %s, got %s',
          expectedDialogHeaderWidth.renderedWidth,
          actualDialogHeaderWidth.renderedWidth);
    }
  });
};

/**
 * Test that navigating back from a sub-folder in Google Drive> Shared With Me
 * using the breadcrumbs.
 * Internally Shared With Me uses some of the Drive Search code, this confused
 * the DirectoryModel clearing the search state in the Store.
 */
// @ts-ignore: error TS4111: Property 'breadcrumbNavigateBackToSharedWithMe'
// comes from an index signature, so it must be accessed with
// ['breadcrumbNavigateBackToSharedWithMe'].
testcase.breadcrumbNavigateBackToSharedWithMe = async () => {
  // Open Files app on Drive containing "Shared with me" file entries.
  const sharedSubFolderName = ENTRIES.sharedWithMeDirectory.nameText;
  const appId = await setupAndWaitUntilReady(
      RootPath.DRIVE, [], [ENTRIES.sharedWithMeDirectory, ENTRIES.hello]);

  // Navigate to Shared with me.
  const directoryTree = await DirectoryTreePageObject.create(appId, remoteCall);
  await directoryTree.selectItemByLabel('Shared with me');

  // Wait until the breadcrumb path is updated.
  await remoteCall.waitUntilCurrentDirectoryIsChanged(appId, '/Shared with me');

  // Navigate to the directory within Shared with me.
  await remoteCall.waitUntilSelected(appId, sharedSubFolderName);
  await remoteCall.fakeKeyDown(
      appId, '#file-list', 'Enter', false, false, false);

  await remoteCall.waitUntilCurrentDirectoryIsChanged(
      appId, `/Shared with me/${sharedSubFolderName}`);

  // Navigate back using breadcrumb.
  await remoteCall.waitAndClickElement(
      appId, ['xf-breadcrumb', 'button[id="first"]']);

  // Wait until the breadcrumb path is updated.
  await remoteCall.waitUntilCurrentDirectoryIsChanged(appId, '/Shared with me');
};
