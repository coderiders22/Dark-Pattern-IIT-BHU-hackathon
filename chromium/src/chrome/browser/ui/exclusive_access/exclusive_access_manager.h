// Copyright 2015 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

#ifndef CHROME_BROWSER_UI_EXCLUSIVE_ACCESS_EXCLUSIVE_ACCESS_MANAGER_H_
#define CHROME_BROWSER_UI_EXCLUSIVE_ACCESS_EXCLUSIVE_ACCESS_MANAGER_H_

#include "base/memory/raw_ptr.h"
#include "chrome/browser/ui/exclusive_access/exclusive_access_bubble_type.h"
#include "chrome/browser/ui/exclusive_access/fullscreen_controller.h"
#include "chrome/browser/ui/exclusive_access/keyboard_lock_controller.h"
#include "chrome/browser/ui/exclusive_access/pointer_lock_controller.h"

class ExclusiveAccessContext;
class FullscreenController;
class GURL;
class KeyboardLockController;
class PointerLockController;

namespace content {
struct NativeWebKeyboardEvent;
class WebContents;
}

// This class combines the different exclusive access modes (like fullscreen and
// pointer lock) which are each handled by respective controller. It also
// updates the exit bubble to reflect the combined state.
class ExclusiveAccessManager {
 public:
  explicit ExclusiveAccessManager(
      ExclusiveAccessContext* exclusive_access_context);

  ExclusiveAccessManager(const ExclusiveAccessManager&) = delete;
  ExclusiveAccessManager& operator=(const ExclusiveAccessManager&) = delete;

  ~ExclusiveAccessManager();

  FullscreenController* fullscreen_controller() {
    return &fullscreen_controller_;
  }

  KeyboardLockController* keyboard_lock_controller() {
    return &keyboard_lock_controller_;
  }

  PointerLockController* pointer_lock_controller() {
    return &pointer_lock_controller_;
  }

  ExclusiveAccessContext* context() const { return exclusive_access_context_; }

  ExclusiveAccessBubbleType GetExclusiveAccessExitBubbleType() const;
  void UpdateExclusiveAccessExitBubbleContent(ExclusiveAccessBubbleHideCallback,
                                              bool force_update = false);

  GURL GetExclusiveAccessBubbleURL() const;

  // Records the keyboard/pointer lock state in a histogram. These should be
  // called when the user enters fullscreen through the Fullscreen API or the
  // browesr UI, respectively.
  void RecordLockStateOnEnteringApiFullscreen() const;
  void RecordLockStateOnEnteringBrowserFullscreen() const;

  // Callbacks ////////////////////////////////////////////////////////////////

  // Called by Browser::TabDeactivated.
  void OnTabDeactivated(content::WebContents* web_contents);

  // Called by Browser::ActiveTabChanged.
  void OnTabDetachedFromView(content::WebContents* web_contents);

  // Called by Browser::TabClosingAt.
  void OnTabClosing(content::WebContents* web_contents);

  // Called by Browser::PreHandleKeyboardEvent.
  bool HandleUserKeyEvent(const content::NativeWebKeyboardEvent& event);

  // Called by Browser::ContentsMouseEvent.
  void OnUserInput();

  // Called by platform ExclusiveAccessExitBubble.
  void ExitExclusiveAccess();

 private:
  void RecordLockStateOnEnteringFullscreen(const char histogram_name[]) const;

  const raw_ptr<ExclusiveAccessContext, DanglingUntriaged>
      exclusive_access_context_;
  FullscreenController fullscreen_controller_;
  KeyboardLockController keyboard_lock_controller_;
  PointerLockController pointer_lock_controller_;
};

#endif  // CHROME_BROWSER_UI_EXCLUSIVE_ACCESS_EXCLUSIVE_ACCESS_MANAGER_H_
