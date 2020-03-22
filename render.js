(() => {
	var {
		Formio
	} = require("formiojs");
	var axios = require("axios").default;
	var remote = require("electron").remote;
	var config = require("./config");
	var path = require("path");
	var fs = require("fs");
	Formio.setApiUrl('http://localhost:16750/');
	Formio.setBaseUrl('http://localhost:16750/');

	window.axios = axios;
	process = undefined;

	var current_form_file_name = '';

	var t_import = ((require) => {
		return function t_import(name) {
			return require(path.join(path.dirname(current_form_file_name), name));
		}
	})(require);

	require = undefined;
	window.require = undefined;

	function show_builder(data) {

		document.getElementById('root').innerHTML = `
		<div class="row">
			<div class="col-xl-8 p-3" id="editor-div"></div>
			<div class="col-xl-4 p-3">
				<div class="border bg-light p-3" id="preview-div"></div>
			</div>
		</div>
  		`

		function show_preview(schema) {
			Formio.createForm(document.getElementById('preview-div'), schema);
		}

		Formio.builder(document.getElementById('editor-div'), data, {
			builder: {
				premium: false
			}
		}).then(builder => {

			show_preview(data);

			builder.on('saveComponent', () => {
				show_preview(builder.schema);
				fs.writeFile(current_form_file_name, JSON.stringify(builder.schema), (err) => {
					if (err) {
						console.error(err);
					} else {
						console.log('save successful');
					}
				});
			})
		})
	}

	function add_form(data, no_home) {
		var links = config.get('toolLinks');
		links.push({
			url: data.url,
			title: data.title
		})
		config.set('toolLinks', links);

		if (!no_home) {
			show_home();
		}
	}

	window.add_form = add_form;

	function delete_form(url) {
		var links = config.get('toolLinks');
		links = links.filter(x => x.url != url);
		config.set('toolLinks', links);
		show_home();
	}

	window.delete_form = delete_form;

	function show_home() {
		var data = '<ul>'
		config.get('toolLinks').forEach(x => {
			data += `<li><a onclick="show_form('${x.url}')" href="#">${x.title}</a> [${x.url}] &nbsp;&nbsp;&nbsp; <a onclick="delete_form('${x.url}')" href="#">(delete)</a></li>`
		})

		data += '</ul><div id="create-new"></div>';

		document.getElementById('root').innerHTML = data;

		Formio.createForm(document.getElementById('create-new'), {
			"display": "form",
			"components": [{
					"label": "Url",
					"validate": {
						"required": true
					},
					"key": "url",
					"type": "url",
					"input": true
				},
				{
					"label": "Title",
					"validate": {
						"required": true
					},
					"key": "title",
					"type": "textfield",
					"input": true
				},
				{
					"label": "Add",
					"action": "custom",
					"showValidations": true,
					"disableOnInvalid": true,
					"tableView": false,
					"key": "add",
					"type": "button",
					"custom": "add_form(data)",
					"input": true
				}
			]
		})
	}

	window.show_home = show_home;

	function create_new() {
		var s = remote.dialog.showSaveDialog({
			filters: [{
				name: "JSON File",
				extensions: ["json"]
			}],
			title: "Create New Form"
		}).then(s => {
			if (s.canceled) {
				return;
			}

			current_form_file_name = s.filePath;

			add_form({
				url: 'file:///' + current_form_file_name.replace(/\\/g, "/"),
				title: path.basename(current_form_file_name)
			}, true);

			show_builder({});
		})
	}

	window.create_new = create_new;

	function edit_form() {
		var s = remote.dialog.showOpenDialog({
			filters: [{
				name: "JSON File",
				extensions: ["json"]
			}],
			title: "Create New Form",
			properties: [
				"openFile"
			]
		}).then(s => {
			if (s.canceled) {
				return;
			}

			current_form_file_name = s.filePaths[0];
			fs.readFile(current_form_file_name, {
				encoding: "utf-8"
			}, (err, data) => {
				if (err) {
					console.log(err);
				} else {
					show_builder(JSON.parse(data));
				}
			})
		})
	}

	window.edit_form = edit_form;

	function show_form(url) {
		axios.get(url).then(x => {
			console.log(x.data);
			Formio.createForm(document.getElementById('root'), x.data).then(form => {
				form.nosubmit = true;
			})
		})
	}

	window.show_form = show_form;

	window.onload = function () {
		show_home();
	};
})()
