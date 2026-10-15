package com.ckeditor.markdownapp

import org.junit.Assert.*
import org.junit.Test

class WindowPolicyTest {
    @Test fun launcherReturnsToLauncherEvenWhenItHasAFile() {
        assertTrue(WindowPolicy.matches(true, null, true, "file:B", 1, -1))
        assertFalse(WindowPolicy.matches(true, null, false, "file:A", 2, -1))
    }
    @Test fun externalFileCanFocusLauncherWindow() {
        assertTrue(WindowPolicy.matches(false, "file:A", true, "file:A", 1, -1))
    }
    @Test fun saveAsUsesCurrentIdentityNotOriginalFile() {
        assertFalse(WindowPolicy.matches(false, "file:A", false, "file:B", 1, -1))
        assertTrue(WindowPolicy.matches(false, "file:B", false, "file:B", 1, -1))
    }
    @Test fun loadingNeverFocusesItsOwnReservedTaskInsteadOfReadingFile() {
        assertFalse(WindowPolicy.matches(false, "file:A", false, "file:A", 1, 1))
    }
    @Test fun newFilesAndBlankWindowsDoNotMatch() {
        assertFalse(WindowPolicy.matches(false, "file:A", false, "file:B", 1, -1))
        assertFalse(WindowPolicy.matches(false, null, true, null, 1, -1))
    }
}
