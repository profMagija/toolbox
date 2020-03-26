# toolbox

A simple app to create, edit, and use *tools* - tiny forms with functionalities.

## Usage

### Add an existing tool

Paste it's url (e.g. `https://www.example.com/path/to/tool.json` or `file:///path/to/tool.json`) into *Url* field, and enter a descriptive title into *Title* field. Click *Add* and the link to the tool will appear. Clicking the link will open the tool, ready for use!

### Create a new tool

Click **Create...** in navbar, and select where to save the new tool. Edit the tool by drag-and-dropping the fields, and editing them by clicking the cogwheel (appears by hovering over the field).

Tips:

- You probably want to use **Buttons** with Action set to *Custom*. Enter javascript code below that will be executed on click. You can use `data` object which contains entered form data.
- You can create a separate `.js` file next to the tool's `.json`. It will be loaded alongside your tool - useful for libraries of functions that can easily be used in the form. You can also use `import()` to include (asynchronously) other files.

You can also edit existing tools from disk by clicking **Edit...** in navbar.

### Running from command line

Command line flags:

- `--form=/path/to/tool.json` opens the given tool for using.
- `--toolbox-no-navbar` hides the navbar.

Everything else is ignored.


## Planed features

 - [X] Loading JS library files
 - [ ] Simple local persistance of field values

## Install

*macOS 10.10+, Linux, and Windows 7+ are supported (64-bit only).*

**macOS**

[**Download**](https://github.com/profmagija/toolbox/releases/latest) the `.dmg` file.

**Linux**

[**Download**](https://github.com/profmagija/toolbox/releases/latest) the `.AppImage` or `.deb` file.

*The AppImage needs to be [made executable](http://discourse.appimage.org/t/how-to-make-an-appimage-executable/80) after download.*

**Windows**

[**Download**](https://github.com/profmagija/toolbox/releases/latest) the `.exe` file.


---


## Dev

Built with [Electron](https://electronjs.org).

### Run

```
$ npm install
$ npm start
```

### Publish

```
$ npm run release
```

After Travis finishes building your app, open the release draft it created and click "Publish".
