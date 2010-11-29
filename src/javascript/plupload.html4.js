<<<<<<< HEAD
/**
 * plupload.html4.js
 *
 * Copyright 2010, Ryan Demmer
 * Copyright 2009, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

// JSLint defined globals
/*global plupload:false, window:false */

(function(plupload) {
	/**
	 * HTML4 implementation. This runtime has no special features it uses an form that posts files into an hidden iframe.
	 *
	 * @static
	 * @class plupload.runtimes.Html4
	 * @extends plupload.Runtime
	 */
	plupload.runtimes.Html4 = plupload.addRuntime("html4", {
		/**
		 * Initializes the upload runtime.
		 *
		 * @method init
		 * @param {plupload.Uploader} uploader Uploader instance that needs to be initialized.
		 * @param {function} callback Callback to execute when the runtime initializes or fails to initialize. If it succeeds an object with a parameter name success will be set to true.
		 */
		init : function(uploader, callback) {
			var iframefiles = {}, form, iframe;

			function addSelectedFiles(element) {
				var file, i, files = [], id, name;

				name = element.value.replace(/\\/g, '/');
				name = name.substring(name.length, name.lastIndexOf('/')+1);

				// Store away gears blob internally
				id = plupload.guid();

				// Expose id, name and size
				file = new plupload.File(id, name);

				iframefiles[id] = file;

				file.input = element;
				files.push(file);

				// Fire FilesAdded event
				if (files.length) {
					uploader.trigger("FilesAdded", files);
				}
			}

			uploader.bind("Init", function(up) {
				var forms, inputContainer, input, mimes = [], i, y,
					filters = up.settings.filters, ext, type, IE = /MSIE/.test(navigator.userAgent),
					url = "javascript", bgcolor, container = document.body;

				if (uploader.settings.container) {
					container = document.getElementById(uploader.settings.container);
					container.style.position = 'relative';
				}

				// If no form set, create or use existing form
				if (!up.settings.form) {
					forms = document.getElementsByTagName('form');

					if (!forms.length) {
						form = document.createElement('form');
						form.setAttribute('action', up.settings.url);
						form.setAttribute('target', '_self');
						document.body.appendChild(form);
					} else {
						form = forms[0];
					}

					form.setAttribute("id", form.id || up.id);
					form.setAttribute('method', 'post');
					form.setAttribute('enctype', 'multipart/form-data');
				} else {
					form = (typeof up.settings.form == 'string') ? document.getElementById(up.settings.form) : up.settings.form;
				}

				// Append mutlipart parameters
				plupload.each(up.settings.multipart_params, function(value, name) {
					var input = document.createElement('input');

					plupload.extend(input, {
						type : 'hidden',
						name : name,
						value : value
					});

					form.appendChild(input);
				});

				iframe = document.createElement('iframe');
				iframe.setAttribute('src', url + ':""'); // javascript:"" for HTTPS issue on IE6, uses a variable to make an ignore for jslint
				iframe.setAttribute('name', up.id + '_iframe');
				iframe.setAttribute('id', up.id + '_iframe');
				iframe.style.display = 'none';

				// Add IFrame onload event
				plupload.addEvent(iframe, 'load', function(e){
					var n = e.target, file = uploader.currentfile, el;

					try {
						el = n.contentWindow.document || n.contentDocument || window.frames[n.id].document;
					} catch (ex) {
						// Probably a permission denied error
						up.trigger('Error', {
							code : plupload.SECURITY_ERROR,
							message : 'Security error.',
							file : file
						});

						return;
					}

					// Return on first load
					if (el.location.href == 'about:blank' || !file) {
						return;
					}

					// Get result
					var result = el.documentElement.innerText || el.documentElement.textContent;

					// Assume no error
					if (result != '') {
						file.status = plupload.DONE;
						file.loaded = 1025;
						file.percent = 100;

						// Remove input element
						if (file.input) {
							file.input.removeAttribute('name');
						}

						up.trigger('UploadProgress', file);
						up.trigger('FileUploaded', file, {
							response : result
						});

						// Reset action and target
						if (form.tmpAction) {
							form.action = form.tmpAction;
						}

						if (form.tmpTarget) {
							form.target = form.tmpTarget;
						}
					}
				});

				// append iframe to form
				form.appendChild(iframe);

				// Change iframe name
				if (IE) {
					window.frames[iframe.id].name = iframe.name;
				}

				// Create container for iframe
				inputContainer = document.createElement('div');
				inputContainer.id = up.id + '_iframe_container';

				// Convert extensions to mime types list
				for (i = 0; i < filters.length; i++) {
					ext = filters[i].extensions.split(/,/);

					for (y = 0; y < ext.length; y++) {
						type = plupload.mimeTypes[ext[y]];

						if (type) {
							mimes.push(type);
						}
					}
				}

				// Set container styles
				plupload.extend(inputContainer.style, {
					position : 'absolute',
					background : 'transparent',
					width : '100px',
					height : '100px',
					overflow : 'hidden',
					zIndex : 99999,
					opacity : 0
				});

				// Show the container if shim_bgcolor is specified
				bgcolor = uploader.settings.shim_bgcolor;
				if (bgcolor) {
					plupload.extend(inputContainer.style, {
						background : bgcolor,
						opacity : 1
					});
				}

				// set container class
				inputContainer.className = 'plupload_iframe';

				// Append to form
				container.appendChild(inputContainer);

				// Create an input element
				function createInput() {
					// Create element and set attributes
					input = document.createElement('input');
					input.setAttribute('type', 'file');
					input.setAttribute('accept', mimes.join(','));
					input.setAttribute('size', 1);

					// set input styles
					plupload.extend(input.style, {
						width : '100%',
						height : '100%',
						opacity : 0
					});

					// no opacity in IE
					if (IE) {
						plupload.extend(input.style, {
							filter : "alpha(opacity=0)"
						});
					}

					// add change event
					plupload.addEvent(input, 'change', function(e) {
						var n = e.target;

						if (n.value) {
							// Create next input
							createInput();
							n.style.display = 'none';
							addSelectedFiles(n);
						}
					});

					// append to container
					inputContainer.appendChild(input);
					return true;
				}

				// Create input element
				createInput();
			});

			// Refresh button
			uploader.bind("Refresh", function(up) {
				var browseButton, browsePos, browseSize;

				browseButton = document.getElementById(uploader.settings.browse_button);
				browsePos = plupload.getPos(browseButton, document.getElementById(up.settings.container));
				browseSize = plupload.getSize(browseButton);

				plupload.extend(document.getElementById(uploader.id + '_iframe_container').style, {
					top : browsePos.y + 'px',
					left : browsePos.x + 'px',
					width : browseSize.w + 'px',
					height : browseSize.h + 'px'
				});
			});

			// Upload file
			uploader.bind("UploadFile", function(up, file) {
				// File upload finished
				if (file.status == plupload.DONE || file.status == plupload.FAILED || up.state == plupload.STOPPED) {
					return;
				}

				// No input element so set error
				if (!file.input) {
					file.status = plupload.ERROR;
					return;
				}

				// Set input element name attribute which allows it to be submitted
				file.input.setAttribute('name', up.settings.file_data_name);

				// Store action
				form.tmpAction = form.action;
				form.action = plupload.buildUrl(up.settings.url, {name : file.target_name || file.name});

				// Store Target
				form.tmpTarget = form.target;
				form.target = iframe.name;

				// set current file
				this.currentfile = file;

				form.submit();
			});

			// Remove files
			uploader.bind("FilesRemoved", function(up, files) {
				var i, n;

				for (i = 0; i < files.length; i++) {
					n = files[i].input;

					// Remove input element
					if (n) {
						n.parentNode.removeChild(n);
					}
				}
			});

			// No features
			uploader.features = {};

			callback({success : true});
		}
	});
})(plupload);
=======
/**
 * plupload.html4.js
 *
 * Copyright 2010, Ryan Demmer
 * Copyright 2009, Moxiecode Systems AB
 * Released under GPL License.
 *
 * License: http://www.plupload.com/license
 * Contributing: http://www.plupload.com/contributing
 */

// JSLint defined globals
/*global plupload:false, window:false */

(function(plupload) {
	function getById(id) {
		return document.getElementById(id);
	}

	/**
	 * HTML4 implementation. This runtime has no special features it uses an form that posts files into an hidden iframe.
	 *
	 * @static
	 * @class plupload.runtimes.Html4
	 * @extends plupload.Runtime
	 */
	plupload.runtimes.Html4 = plupload.addRuntime("html4", {
		/**
		 * Returns a list of supported features for the runtime.
		 *
		 * @return {Object} Name/value object with supported features.
		 */
		getFeatures : function() {
			// Only multipart feature
			return {
				multipart: true
			};
		},

		/**
		 * Initializes the upload runtime.
		 *
		 * @method init
		 * @param {plupload.Uploader} uploader Uploader instance that needs to be initialized.
		 * @param {function} callback Callback to execute when the runtime initializes or fails to initialize. If it succeeds an object with a parameter name success will be set to true.
		 */
		init : function(uploader, callback) {
			uploader.bind("Init", function(up) {
				var container = document.body, iframe, url = "javascript", currentFile,
					input, currentFileId, IE = /MSIE/.test(navigator.userAgent), mimes = [],
					filters = up.settings.filters, i, ext, type, y;

				// Convert extensions to mime types list
				for (i = 0; i < filters.length; i++) {
					ext = filters[i].extensions.split(/,/);

					for (y = 0; y < ext.length; y++) {
						type = plupload.mimeTypes[ext[y]];

						if (type) {
							mimes.push(type);
						}
					}
				}

				mimes = mimes.join(',');

				function createForm() {
					var form, input, bgcolor;

					// Setup unique id for form
					currentFileId = plupload.guid();

					// Create form
					form = document.createElement('form');
					form.setAttribute('id', 'form_' + currentFileId);
					form.setAttribute('method', 'post');
					form.setAttribute('enctype', 'multipart/form-data');
					form.setAttribute('encoding', 'multipart/form-data');
					form.setAttribute("target", up.id + '_iframe');
					form.style.position = 'absolute';

					// Create input and set attributes
					input = document.createElement('input');
					input.setAttribute('id', 'input_' + currentFileId);
					input.setAttribute('type', 'file');
					input.setAttribute('accept', mimes);
					input.setAttribute('size', 1);

					// Set input styles
					plupload.extend(input.style, {
						width : '100%',
						height : '100%',
						opacity : 0
					});

					// Show the container if shim_bgcolor is specified
					bgcolor = up.settings.shim_bgcolor;
					if (bgcolor) {
						form.style.background = bgcolor;
					}

					// no opacity in IE
					if (IE) {
						plupload.extend(input.style, {
							filter : "alpha(opacity=0)"
						});
					}

					// add change event
					plupload.addEvent(input, 'change', function(e) {
						var element = e.target, name, files = [];

						if (element.value) {
							getById('form_' + currentFileId).style.top = -0xFFFFF + "px";

							// Get file name
							name = element.value.replace(/\\/g, '/');
							name = name.substring(name.length, name.lastIndexOf('/') + 1);

							// Push files
							files.push(new plupload.File(currentFileId, name));

							// Create and position next form
							createForm();

							// Fire FilesAdded event
							if (files.length) {
								uploader.trigger("FilesAdded", files);
							}
						}
					});

					// append to container
					form.appendChild(input);
					container.appendChild(form);

					up.refresh();
				}


				function createIframe() {
					var temp = document.createElement('div');

					// Create iframe using a temp div since IE 6 won't be able to set the name using setAttribute or iframe.name
					temp.innerHTML = '<iframe id="' + up.id + '_iframe" name="' + up.id + '_iframe" src="' + url + ':&quot;&quot;" style="display:none"></iframe>';
					iframe = temp.firstChild;
					container.appendChild(iframe);

					// Add IFrame onload event
					plupload.addEvent(iframe, 'load', function(e) {
						var n = e.target, el, result;

						// Ignore load event if there is no file
						if (!currentFile) {
							return;
						}

						try {
							el = n.contentWindow.document || n.contentDocument || window.frames[n.id].document;
						} catch (ex) {
							// Probably a permission denied error
							up.trigger('Error', {
								code : plupload.SECURITY_ERROR,
								message : 'Security error.',
								file : currentFile
							});

							return;
						}

						// Get result
						result = el.documentElement.innerText || el.documentElement.textContent;

						// Assume no error
						if (result) {
							currentFile.status = plupload.DONE;
							currentFile.loaded = 1025;
							currentFile.percent = 100;

							up.trigger('UploadProgress', currentFile);
							up.trigger('FileUploaded', currentFile, {
								response : result
							});
						}
					});

					// Upload file
					up.bind("UploadFile", function(up, file) {
						var form, input;

						// File upload finished
						if (file.status == plupload.DONE || file.status == plupload.FAILED || up.state == plupload.STOPPED) {
							return;
						}

						// Get the form and input elements
						form = getById('form_' + file.id);
						input = getById('input_' + file.id);

						// Set input element name attribute which allows it to be submitted
						input.setAttribute('name', up.settings.file_data_name);

						// Store action
						form.setAttribute("action", up.settings.url);

						// Append multipart parameters
						plupload.each(plupload.extend({name : file.target_name || file.name}, up.settings.multipart_params), function(value, name) {
							var input = document.createElement('input');

							plupload.extend(input, {
								type : 'hidden',
								name : name,
								value : value
							});

							form.insertBefore(input, form.firstChild);
						});

						currentFile = file;

						// Hide the current form
						getById('form_' + currentFileId).style.top = -0xFFFFF + "px";

						form.submit();
						form.parentNode.removeChild(form);
					});
				}

				if (up.settings.container) {
					container = getById(up.settings.container);
					container.style.position = 'relative';
				}

				up.bind('StateChanged', function(up) {
					if (up.state == plupload.STARTED) {
						createIframe();
					}

					if (up.state == plupload.STOPPED) {
						window.setTimeout(function() {
							iframe.parentNode.removeChild(iframe);
						}, 0);
					}
				});

				// Refresh button, will reposition the input form
				up.bind("Refresh", function(up) {
					var browseButton, browsePos, browseSize;

					browseButton = getById(up.settings.browse_button);
					browsePos = plupload.getPos(browseButton, getById(up.settings.container));
					browseSize = plupload.getSize(browseButton);

					plupload.extend(getById('form_' + currentFileId).style, {
						top : browsePos.y + 'px',
						left : browsePos.x + 'px',
						width : browseSize.w + 'px',
						height : browseSize.h + 'px'
					});
				});

				// Remove files
				uploader.bind("FilesRemoved", function(up, files) {
					var i, n;

					for (i = 0; i < files.length; i++) {
						n = getById('form_' + files[i].id);
						n.parentNode.removeChild(n);
					}
				});

				// Create initial form
				createForm();
			});

			callback({success : true});
		}
	});
})(plupload);
>>>>>>> f96dc7bcb9d0b5a100d2bb627359a50a8adf3660
