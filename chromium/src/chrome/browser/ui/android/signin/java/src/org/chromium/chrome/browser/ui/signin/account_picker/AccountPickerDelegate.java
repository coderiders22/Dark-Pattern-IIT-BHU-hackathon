// Copyright 2020 The Chromium Authors
// Use of this source code is governed by a BSD-style license that can be
// found in the LICENSE file.

package org.chromium.chrome.browser.ui.signin.account_picker;

import org.chromium.base.Callback;
import org.chromium.chrome.browser.ui.signin.account_picker.AccountPickerBottomSheetCoordinator.EntryPoint;
import org.chromium.components.signin.base.CoreAccountInfo;
import org.chromium.components.signin.base.GoogleServiceAuthError;

/**
 * This interface abstracts the sign-in logic for the account picker bottom sheet. There is one
 * implementation per {@link EntryPoint}.
 */
public interface AccountPickerDelegate {
    /** Releases resources used by this class. */
    void destroy();

    /** Signs in the user with the given accountInfo. */
    void signIn(
            CoreAccountInfo accountInfo, Callback<GoogleServiceAuthError> onSignInErrorCallback);

    /** Returns the entry point of this delegate. */
    @EntryPoint
    int getEntryPoint();
}
