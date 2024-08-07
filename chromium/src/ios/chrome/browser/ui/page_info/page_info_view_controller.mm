// Copyright 2020 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#import "ios/chrome/browser/ui/page_info/page_info_view_controller.h"

#import "base/apple/foundation_util.h"
#import "base/metrics/user_metrics.h"
#import "base/metrics/user_metrics_action.h"
#import "base/strings/sys_string_conversions.h"
#import "ios/chrome/browser/net/model/crurl.h"
#import "ios/chrome/browser/shared/model/url/chrome_url_constants.h"
#import "ios/chrome/browser/shared/public/commands/page_info_commands.h"
#import "ios/chrome/browser/shared/ui/symbols/symbols.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_attributed_string_header_footer_item.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_detail_icon_item.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_link_header_footer_item.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_multi_detail_text_item.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_switch_cell.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_switch_item.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_text_header_footer_item.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_text_item.h"
#import "ios/chrome/browser/shared/ui/table_view/cells/table_view_text_link_item.h"
#import "ios/chrome/browser/shared/ui/table_view/table_view_utils.h"
#import "ios/chrome/browser/ui/keyboard/UIKeyCommand+Chrome.h"
#import "ios/chrome/browser/ui/page_info/features.h"
#import "ios/chrome/browser/ui/page_info/page_info_constants.h"
#import "ios/chrome/browser/ui/page_info/page_info_helper.h"
#import "ios/chrome/browser/ui/permissions/permission_info.h"
#import "ios/chrome/browser/ui/permissions/permissions_constants.h"
#import "ios/chrome/browser/ui/permissions/permissions_delegate.h"
#import "ios/chrome/common/string_util.h"
#import "ios/chrome/common/ui/colors/semantic_color_names.h"
#import "ios/chrome/common/ui/table_view/table_view_cells_constants.h"
#import "ios/chrome/grit/ios_strings.h"
#import "ios/web/public/permissions/permissions.h"
#import "ui/base/l10n/l10n_util.h"
#import "url/gurl.h"

namespace {

typedef NS_ENUM(NSInteger, SectionIdentifier) {
  SectionIdentifierSecurityContent,
  SectionIdentifierPermissions,
};

typedef NS_ENUM(NSInteger, ItemIdentifier) {
  ItemIdentifierSecurityHeader,
  ItemIdentifierPermissionsCamera,
  ItemIdentifierPermissionsMicrophone,
};

}  // namespace

@interface PageInfoViewController () <TableViewLinkHeaderFooterItemDelegate>

// The page info security description.
@property(nonatomic, strong)
    PageInfoSiteSecurityDescription* pageInfoSecurityDescription;

// The list of permissions info used to create switches.
@property(nonatomic, copy)
    NSMutableDictionary<NSNumber*, NSNumber*>* permissionsInfo;

@end

@implementation PageInfoViewController {
  UITableViewDiffableDataSource<NSNumber*, NSNumber*>* _dataSource;
}

#pragma mark - UIViewController

- (instancetype)initWithSiteSecurityDescription:
    (PageInfoSiteSecurityDescription*)siteSecurityDescription {
  UITableViewStyle style = ChromeTableViewStyle();
  self = [super initWithStyle:style];
  if (self) {
    _pageInfoSecurityDescription = siteSecurityDescription;
  }
  return self;
}

- (void)viewDidLoad {
  [super viewDidLoad];

  self.navigationItem.titleView =
      page_info::TitleViewLabelForURL(self.pageInfoSecurityDescription.siteURL);
  self.title = l10n_util::GetNSString(IDS_IOS_PAGE_INFO_SITE_INFORMATION);
  self.tableView.accessibilityIdentifier = kPageInfoViewAccessibilityIdentifier;
  self.navigationController.navigationBar.accessibilityIdentifier =
      kPageInfoViewNavigationBarAccessibilityIdentifier;

  UIBarButtonItem* dismissButton = [[UIBarButtonItem alloc]
      initWithBarButtonSystemItem:UIBarButtonSystemItemDone
                           target:self.pageInfoCommandsHandler
                           action:@selector(hidePageInfo)];
  self.navigationItem.rightBarButtonItem = dismissButton;
  self.tableView.separatorInset =
      UIEdgeInsetsMake(0, kPageInfoTableViewSeparatorInset, 0, 0);
  if (!IsRevampPageInfoIosEnabled()) {
    self.tableView.allowsSelection = NO;
  }

  if (self.pageInfoSecurityDescription.isEmpty) {
    [self addEmptyTableViewWithMessage:self.pageInfoSecurityDescription.message
                                 image:nil];
    self.tableView.alwaysBounceVertical = NO;
    self.tableView.separatorStyle = UITableViewCellSeparatorStyleNone;
    return;
  }

  [self loadModel];
}

#pragma mark - LegacyChromeTableViewController

- (void)loadModel {
  __weak __typeof(self) weakSelf = self;
  _dataSource = [[UITableViewDiffableDataSource alloc]
      initWithTableView:self.tableView
           cellProvider:^UITableViewCell*(UITableView* tableView,
                                          NSIndexPath* indexPath,
                                          NSNumber* itemIdentifier) {
             return
                 [weakSelf cellForTableView:tableView
                                  indexPath:indexPath
                             itemIdentifier:static_cast<ItemIdentifier>(
                                                itemIdentifier.integerValue)];
           }];

  RegisterTableViewCell<TableViewDetailIconCell>(self.tableView);
  RegisterTableViewCell<TableViewSwitchCell>(self.tableView);
  RegisterTableViewHeaderFooter<TableViewTextHeaderFooterView>(self.tableView);
  RegisterTableViewHeaderFooter<TableViewLinkHeaderFooterView>(self.tableView);
  RegisterTableViewHeaderFooter<TableViewAttributedStringHeaderFooterView>(
      self.tableView);

  NSDiffableDataSourceSnapshot* snapshot =
      [[NSDiffableDataSourceSnapshot alloc] init];
  [snapshot
      appendSectionsWithIdentifiers:@[ @(SectionIdentifierSecurityContent) ]];
  [snapshot appendItemsWithIdentifiers:@[ @(ItemIdentifierSecurityHeader) ]];

  // Permissions section.
  for (NSNumber* permission in self.permissionsInfo.allKeys) {
    [self updateSnapshot:snapshot forPermission:permission];
  }
  [_dataSource applySnapshot:snapshot animatingDifferences:NO];
}

#pragma mark - UITableViewDelegate

- (void)tableView:(UITableView*)tableView
    didSelectRowAtIndexPath:(NSIndexPath*)indexPath {
  DCHECK(self.pageInfoPresentationHandler);
  ItemIdentifier itemType = static_cast<ItemIdentifier>(
      [_dataSource itemIdentifierForIndexPath:indexPath].integerValue);
  switch (itemType) {
    case ItemIdentifierSecurityHeader:
      if (IsRevampPageInfoIosEnabled()) {
        [self.pageInfoPresentationHandler showSecurityPage];
      }
      break;
    default:
      break;
  }
}

- (CGFloat)tableView:(UITableView*)tableView
    heightForHeaderInSection:(NSInteger)section {
  return section == SectionIdentifierSecurityContent
             ? kPageInfoPaddingFirstSectionHeader
             : UITableViewAutomaticDimension;
}

- (UIView*)tableView:(UITableView*)tableView
    viewForHeaderInSection:(NSInteger)section {
  SectionIdentifier sectionIdentifier = static_cast<SectionIdentifier>(
      [_dataSource sectionIdentifierForIndex:section].integerValue);
  switch (sectionIdentifier) {
    case SectionIdentifierSecurityContent:
      return nil;
    case SectionIdentifierPermissions: {
      TableViewTextHeaderFooterView* header =
          DequeueTableViewHeaderFooter<TableViewTextHeaderFooterView>(
              self.tableView);
      header.textLabel.text =
          l10n_util::GetNSString(IDS_IOS_PAGE_INFO_PERMISSIONS_HEADER);
      [header setSubtitle:nil];
      return header;
    }
  }
}

- (UIView*)tableView:(UITableView*)tableView
    viewForFooterInSection:(NSInteger)section {
  SectionIdentifier sectionIdentifier = static_cast<SectionIdentifier>(
      [_dataSource sectionIdentifierForIndex:section].integerValue);
  switch (sectionIdentifier) {
    case SectionIdentifierSecurityContent: {
      if (IsRevampPageInfoIosEnabled()) {
        // Don't show the security footer in the revamp UI.
        return nil;
      }

      TableViewLinkHeaderFooterView* footer =
          DequeueTableViewHeaderFooter<TableViewLinkHeaderFooterView>(
              self.tableView);
      footer.urls =
          @[ [[CrURL alloc] initWithGURL:GURL(kPageInfoHelpCenterURL)] ];
      [footer setText:self.pageInfoSecurityDescription.message
            withColor:[UIColor colorNamed:kTextSecondaryColor]];
      footer.delegate = self;
      footer.accessibilityIdentifier =
          kPageInfoSecurityFooterAccessibilityIdentifier;
      return footer;
    }
    case SectionIdentifierPermissions: {
      TableViewAttributedStringHeaderFooterView* footer =
          DequeueTableViewHeaderFooter<
              TableViewAttributedStringHeaderFooterView>(self.tableView);
      footer.attributedString = [self permissionFooterAttributedString];
      return footer;
    }
  }
}

#pragma mark - TableViewLinkHeaderFooterItemDelegate

- (void)view:(TableViewLinkHeaderFooterView*)view didTapLinkURL:(CrURL*)URL {
  DCHECK(URL.gurl == GURL(kPageInfoHelpCenterURL));
  [self.pageInfoCommandsHandler showSecurityHelpPage];
}

#pragma mark - UIAdaptivePresentationControllerDelegate

- (void)presentationControllerDidDismiss:
    (UIPresentationController*)presentationController {
  [self.pageInfoCommandsHandler hidePageInfo];
}

#pragma mark - UIResponder

// To always be able to register key commands via -keyCommands, the VC must be
// able to become first responder.
- (BOOL)canBecomeFirstResponder {
  return YES;
}

- (NSArray*)keyCommands {
  return @[ UIKeyCommand.cr_close ];
}

- (void)keyCommand_close {
  base::RecordAction(base::UserMetricsAction("MobileKeyCommandClose"));
  [self.pageInfoCommandsHandler hidePageInfo];
}

#pragma mark - Private

// Returns a cell.
- (UITableViewCell*)cellForTableView:(UITableView*)tableView
                           indexPath:(NSIndexPath*)indexPath
                      itemIdentifier:(ItemIdentifier)itemIdentifier {
  switch (itemIdentifier) {
    case ItemIdentifierSecurityHeader: {
      TableViewDetailIconCell* cell =
          DequeueTableViewCell<TableViewDetailIconCell>(tableView);
      cell.textLabel.text = l10n_util::GetNSString(
          IsRevampPageInfoIosEnabled() ? IDS_IOS_PAGE_INFO_CONNECTION
                                       : IDS_IOS_PAGE_INFO_SITE_SECURITY);
      cell.detailText = self.pageInfoSecurityDescription.status;
      [cell setIconImage:self.pageInfoSecurityDescription.iconImage
                tintColor:UIColor.whiteColor
          backgroundColor:self.pageInfoSecurityDescription.iconBackgroundColor
             cornerRadius:kColorfulBackgroundSymbolCornerRadius];

      if (IsRevampPageInfoIosEnabled()) {
        cell.accessoryType = UITableViewCellAccessoryDisclosureIndicator;
      }

      return cell;
    }
    case ItemIdentifierPermissionsCamera: {
      TableViewSwitchCell* cell =
          DequeueTableViewCell<TableViewSwitchCell>(tableView);
      BOOL permissionOn =
          self.permissionsInfo[@(web::PermissionCamera)].unsignedIntValue ==
          web::PermissionStateAllowed;
      NSString* title = l10n_util::GetNSString(IDS_IOS_PERMISSIONS_CAMERA);
      [cell configureCellWithTitle:title
                          subtitle:nil
                     switchEnabled:YES
                                on:permissionOn];
      cell.accessibilityIdentifier =
          kPageInfoCameraSwitchAccessibilityIdentifier;
      cell.switchView.tag = itemIdentifier;
      [cell.switchView addTarget:self
                          action:@selector(permissionSwitchToggled:)
                forControlEvents:UIControlEventValueChanged];
      return cell;
    }
    case ItemIdentifierPermissionsMicrophone: {
      TableViewSwitchCell* cell =
          DequeueTableViewCell<TableViewSwitchCell>(tableView);
      BOOL permissionOn =
          self.permissionsInfo[@(web::PermissionMicrophone)].unsignedIntValue ==
          web::PermissionStateAllowed;
      NSString* title = l10n_util::GetNSString(IDS_IOS_PERMISSIONS_MICROPHONE);
      [cell configureCellWithTitle:title
                          subtitle:nil
                     switchEnabled:YES
                                on:permissionOn];
      cell.accessibilityIdentifier =
          kPageInfoMicrophoneSwitchAccessibilityIdentifier;
      cell.switchView.tag = itemIdentifier;
      [cell.switchView addTarget:self
                          action:@selector(permissionSwitchToggled:)
                forControlEvents:UIControlEventValueChanged];
      return cell;
    }
  }
}

// Returns the attributed string for the permission footer.
- (NSAttributedString*)permissionFooterAttributedString {
  NSString* description = l10n_util::GetNSStringF(
      IDS_IOS_PERMISSIONS_INFOBAR_MODAL_DESCRIPTION,
      base::SysNSStringToUTF16(self.pageInfoSecurityDescription.siteURL));
  NSMutableAttributedString* descriptionAttributedString =
      [[NSMutableAttributedString alloc]
          initWithAttributedString:PutBoldPartInString(
                                       description, UIFontTextStyleFootnote)];
  [descriptionAttributedString
      addAttributes:@{
        NSForegroundColorAttributeName :
            [UIColor colorNamed:kTextSecondaryColor]
      }
              range:NSMakeRange(0, descriptionAttributedString.length)];
  return descriptionAttributedString;
}

// Updates `snapshot` to reflect the changes done to `permissions`.
- (void)updateSnapshot:
            (NSDiffableDataSourceSnapshot<NSNumber*, NSNumber*>*)snapshot
         forPermission:(NSNumber*)permission {
  web::PermissionState state = static_cast<web::PermissionState>(
      self.permissionsInfo[permission].unsignedIntegerValue);
  ItemIdentifier itemIdentifier;
  switch (static_cast<web::Permission>(permission.unsignedIntValue)) {
    case web::PermissionCamera:
      itemIdentifier = ItemIdentifierPermissionsCamera;
      break;
    case web::PermissionMicrophone:
      itemIdentifier = ItemIdentifierPermissionsMicrophone;
      break;
  }
  [self updateSnapshot:snapshot forPermissionState:state toItem:itemIdentifier];
}

// Invoked when a permission switch is toggled.
- (void)permissionSwitchToggled:(UISwitch*)sender {
  web::Permission permission;
  switch (sender.tag) {
    case ItemIdentifierPermissionsCamera:
      permission = web::PermissionCamera;
      break;
    case ItemIdentifierPermissionsMicrophone:
      permission = web::PermissionMicrophone;
      break;
  }
  PermissionInfo* permissionsDescription = [[PermissionInfo alloc] init];
  permissionsDescription.permission = permission;
  permissionsDescription.state =
      sender.isOn ? web::PermissionStateAllowed : web::PermissionStateBlocked;
  [self.permissionsDelegate updateStateForPermission:permissionsDescription];
}

// Updates the `snapshot` (including adds/removes section) to reflect changes to
// `itemIdentifier`'s `state`.
- (void)updateSnapshot:
            (NSDiffableDataSourceSnapshot<NSNumber*, NSNumber*>*)snapshot
    forPermissionState:(web::PermissionState)state
                toItem:(ItemIdentifier)itemIdentifier {
  NSInteger sectionIndex =
      [snapshot indexOfSectionIdentifier:@(SectionIdentifierPermissions)];
  if (sectionIndex == NSNotFound) {
    [snapshot
        insertSectionsWithIdentifiers:@[ @(SectionIdentifierPermissions) ]
           afterSectionWithIdentifier:@(SectionIdentifierSecurityContent)];
  }

  BOOL itemVisible = state != web::PermissionStateNotAccessible;
  if (itemVisible) {
    if ([_dataSource indexPathForItemIdentifier:@(itemIdentifier)]) {
      [snapshot reconfigureItemsWithIdentifiers:@[ @(itemIdentifier) ]];
    } else {
      if (itemIdentifier == ItemIdentifierPermissionsCamera &&
          [_dataSource indexPathForItemIdentifier:
                           @(ItemIdentifierPermissionsMicrophone)]) {
        [snapshot
            insertItemsWithIdentifiers:@[ @(itemIdentifier) ]
              beforeItemWithIdentifier:@(ItemIdentifierPermissionsMicrophone)];
      } else {
        [snapshot appendItemsWithIdentifiers:@[ @(itemIdentifier) ]
                   intoSectionWithIdentifier:@(SectionIdentifierPermissions)];
      }
    }
  } else {
    [snapshot deleteItemsWithIdentifiers:@[ @(itemIdentifier) ]];
  }

  if ([snapshot numberOfItemsInSection:@(SectionIdentifierPermissions)] == 0) {
    [snapshot
        deleteSectionsWithIdentifiers:@[ @(SectionIdentifierPermissions) ]];
  }
}

#pragma mark - PermissionsConsumer

- (void)setPermissionsInfo:
    (NSDictionary<NSNumber*, NSNumber*>*)permissionsInfo {
  _permissionsInfo = [permissionsInfo mutableCopy];
}

- (void)permissionStateChanged:(PermissionInfo*)permissionInfo {
  self.permissionsInfo[@(permissionInfo.permission)] = @(permissionInfo.state);

  NSDiffableDataSourceSnapshot<NSNumber*, NSNumber*>* snapshot =
      [_dataSource snapshot];
  [self updateSnapshot:snapshot forPermission:@(permissionInfo.permission)];
  [_dataSource applySnapshot:snapshot animatingDifferences:YES];
}

@end
