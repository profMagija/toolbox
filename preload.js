let Formio;
const path = require("path");
const axios = require("axios").default;
const {
	remote
} = require("electron");
const config = require("./config");
const {
	basename
} = require("path");
const {
	writeFile,
	readFile
} = require("fs");



var current_form_file_name = '';

async function try_get_js(url) {
	if (url.endsWith(".json")) {
		try {
			let s = document.createElement('script');
			s.type = 'text/javascript';
			s.src = url.replace(/\.json$/, ".js");
			document.head.appendChild(s);
		} catch (err) {

		}
	}
}

function show_builder(data) {

	document.getElementById('root').innerHTML = `
	<div class="row">
		<div class="col-xl-8 p-3" id="editor-div"></div>
		<div class="col-xl-4 p-3">
			<div class="border bg-light p-3" id="preview-div"></div>
		</div>
	</div>
	`

	async function show_preview(schema) {
		try_get_js('file://' + current_form_file_name);
		Formio.createForm(document.getElementById('preview-div'), schema);
	}

	Formio.builder(document.getElementById('editor-div'), data, {
		builder: {
			premium: false,
			data: false,
			customData: {
				title: "Data",
				weight: 100,
				components: {
					hidden: true,
					container: true,
					datamap: true,
					datagrid: true,
					editgrid: true,
					tree: true,
					file: true
				}
			}
		}
	}).then(builder => {

		show_preview(data);

		builder.on('saveComponent', async () => {
			show_preview(builder.schema);
			writeFile(current_form_file_name, JSON.stringify(builder.schema), (err) => {
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

function delete_form(url) {
	var links = config.get('toolLinks');
	links = links.filter(x => x.url != url);
	config.set('toolLinks', links);
	show_home();
}

function show_home() {
	var data = '<ul>'
	config.get('toolLinks').forEach(x => {
		data += `<li><a onclick="toolbox.show_form('${x.url}')" href="#">${x.title}</a> [${x.url}] &nbsp;&nbsp;&nbsp; <a onclick="toolbox.delete_form('${x.url}')" href="#">(delete)</a></li>`
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
				"custom": "toolbox.add_form(data)",
				"input": true
			}
		]
	})
}

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
			title: basename(current_form_file_name)
		}, true);

		show_builder({});
	})
}

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
		readFile(current_form_file_name, {
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

/**
 * @param {string} url
 */
async function show_form(url) {
	let response;
	try {
		response = await axios.get(url);
	} catch (err) {
		console.error(err);
		document.getElementById('root').innerHTML = `
		<div class="alert alert-danger" role="alert">
			Could not load form: ${err.message}
		</div>
		`
		return;
	}

	await try_get_js(url);

	Formio.createForm(document.getElementById('root'), response.data).then(form => {
		form.nosubmit = true;
	})
}

function create_provider(data) {
	const provider = function () {
		return data;
	}

	provider.title = data.title;
	return provider;
}

function setup_formio() {

	const providers = require("formiojs").Providers;

	function add_provider(data) {
		const provider = function () {
			return data
		};
		provider.prototype = {
			constructor: provider
		};
		provider.name = data.name;
		provider.title = data.title;
		providers.addProvider('storage', data.name, provider);
	}

	add_provider({
		title: "Data (Array Buffer)",
		name: 'dataarraybuf',
		uploadFile(file, fileName) {
			const reader = new FileReader();

			return new Promise((resolve, reject) => {
				reader.onload = (event) => {
					const data = event.target.result;
					resolve({
						storage: 'dataarraybuf',
						name: fileName,
						data: data,
						size: file.size,
						type: file.type,
					});
				};

				reader.onerror = () => {
					return reject(this);
				};

				reader.readAsArrayBuffer(file);
			});
		},
		downloadFile(file) {
			// Return the original as there is nothing to do.
			return Promise.resolve(file);
		}
	});

	add_provider({
		title: "Data (Text)",
		name: 'datatext',
		uploadFile(file, fileName) {
			const reader = new FileReader();

			return new Promise((resolve, reject) => {
				reader.onload = (event) => {
					const data = event.target.result;
					resolve({
						storage: 'datatext',
						name: fileName,
						data: data,
						size: file.size,
						type: file.type,
					});
				};

				reader.onerror = () => {
					return reject(this);
				};

				reader.readAsText(file);
			});
		},
		downloadFile(file) {
			// Return the original as there is nothing to do.
			return Promise.resolve(file);
		}
	});
}

function startup() {

	Formio = require("formiojs").Formio;
	Formio.setApiUrl('http://localhost:16750/');
	Formio.setBaseUrl('http://localhost:16750/');

	setup_formio();

	if (remote.process.argv.some(x => x.toLowerCase() == '--toolbox-no-navbar')) {
		document.getElementById('toolbox-navbar').remove();
	}

	let form = remote.app.commandLine.getSwitchValue("form");
	if (form) {
		show_form(form);
	} else {
		show_home();
	}
}

// exports to window

window.axios = axios;
window.toolbox = {
	show_builder,
	add_form,
	delete_form,
	show_home,
	create_new,
	edit_form,
	show_form,
	startup
};
