// Copyright 2023 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef IOS_CHROME_BROWSER_UI_TAB_SWITCHER_TAB_GRID_GRID_TAB_GROUPS_TAB_GROUP_VIEW_CONTROLLER_H_
#define IOS_CHROME_BROWSER_UI_TAB_SWITCHER_TAB_GRID_GRID_TAB_GROUPS_TAB_GROUP_VIEW_CONTROLLER_H_

#import <UIKit/UIKit.h>

#import "ios/chrome/browser/ui/tab_switcher/tab_grid/grid/tab_groups/tab_group_consumer.h"

@class BaseGridViewController;
@protocol TabGroupsCommands;
@protocol TabGroupMutator;

// Tab group view controller displaying one group.
@interface TabGroupViewController : UIViewController <TabGroupConsumer>

// Mutator used to send notification to the tab group  model.
@property(nonatomic, weak) id<TabGroupMutator> mutator;

// The embedded grid view controller.
@property(nonatomic, readonly) BaseGridViewController* gridViewController;

// Initiates a TabGroupViewController with `handler` to handle user action,
// `lightTheme` to YES to have a light theme.
- (instancetype)initWithHandler:(id<TabGroupsCommands>)handler
                     lightTheme:(BOOL)lightTheme;

@end

#endif  // IOS_CHROME_BROWSER_UI_TAB_SWITCHER_TAB_GRID_GRID_TAB_GROUPS_TAB_GROUP_VIEW_CONTROLLER_H_
