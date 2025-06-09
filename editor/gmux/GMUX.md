# GMUX

## The Model

There are multiple sessions. Each session has multiple windows. Each windows has a layout, consisting of groups (which are used for layout) and panels within these groups.

Now actual editors need to run in these panels. The question is: is an editor associated with a panel, or with a panel in a window. The difference is that if it's associated just with a panel then the panel could be switched for a different panel in that same window, so multiple editors share the window. The alternative is that the panels in a window are fixed and therefore to open a new editor you open a new window.

Sessions map to projects. One-off terminals or file edits will also be in their own single-window session. For projects though, multiple window sessions are required (the principle is that you go deeper into the hierarchy of the model to "narrow" your focus). Sessions should therefore feel lightweight, be fast to create and easy to navigate between.

The issue with associating the editor with the window is that it doesn't work for multiple panel windows, where the contents of the second panel may change and may be shared with another window. So for that reason, editors should be independent of windows. Each editor owns a panel and it can be placed in any window.

In fact, it can be placed in MULTIPLE windows.
