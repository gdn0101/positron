/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2023-2024 Posit Software, PBC. All rights reserved.
 *  Licensed under the Elastic License 2.0. See LICENSE.txt for license information.
 *--------------------------------------------------------------------------------------------*/

import { Emitter } from 'vs/base/common/event';
import { URI } from 'vs/base/common/uri';
import { POSITRON_PREVIEW_URL_VIEW_TYPE } from 'vs/workbench/contrib/positronPreview/browser/positronPreviewSevice';
import { PreviewWebview } from 'vs/workbench/contrib/positronPreview/browser/previewWebview';
import { IOverlayWebview } from 'vs/workbench/contrib/webview/browser/webview';

export const QUERY_NONCE_PARAMETER = '_positronRender';

/**
 * PreviewUrl is a class that represents a Positron `PreviewWebview` that
 * contains a URL preview.
 */
export class PreviewUrl extends PreviewWebview {

	/**
	 * A nonce to append to the URI to ensure that the preview is not cached.
	 */
	private static _nonce = 0;

	/**
	 * Construct a new PreviewWebview.
	 *
	 * @param previewId A unique ID for the preview
	 * @param webview The underlying webview instance that hosts the preview's content
	 * @param _uri The URI to open in the preview
	 */
	constructor(
		previewId: string,
		webview: IOverlayWebview,
		private _uri: URI
	) {
		super(POSITRON_PREVIEW_URL_VIEW_TYPE, previewId,
			POSITRON_PREVIEW_URL_VIEW_TYPE,
			webview);

		// Perform the initial navigation.
		this.navigateToUri(_uri);

		// Listen for navigation events.
		this.webview.onDidNavigate(e => {
			this._onDidNavigate.fire(e);
			this._uri = e;
		});
	}


	/**
	 * Navigate to a new URI in the preview.
	 *
	 * @param uri The URI to navigate to.
	 */
	public navigateToUri(uri: URI): void {
		this._uri = uri;

		// Amend a nonce to the URI for cache busting.
		const nonce = `${QUERY_NONCE_PARAMETER}=${(PreviewUrl._nonce++).toString(16)}`;
		const iframeUri = this._uri.with({
			query:
				uri.query ? uri.query + '&' + nonce : nonce
		});
		this.loadUri(iframeUri);
	}

	public _onDidNavigate = this._register(new Emitter<URI>());
	public onDidNavigate = this._onDidNavigate.event;

	get currentUri(): URI {
		return this._uri;
	}

	/**
	 * Loads a URI in the internal webview.
	 *
	 * This is overridden in the Electron implementation to use the webview's
	 * `loadUri` method, which has native support for loading URIs.
	 *
	 * @param uri The URI to load
	 */
	protected loadUri(uri: URI): void {
		this.webview.setHtml(`
		<html>
			<head>
				<style>
					html, body {
						padding: 0;
						margin: 0;
						height: 100%;
						min-height: 100%;
					}
					iframe {
						width: 100%;
						height: 100%;
						border: none;
						display: block;
					}
				</style>
				<script>
					// Get a reference to the VS Code API
					const vscode = acquireVsCodeApi();
					// Listen for messages from the parent window
					window.addEventListener('message', e => {
						// Ignore non-command messages
						if (!e.data.channel === 'execCommand') {
							return;
						}

						// Get the IFrame element hosting the preview URL
						const iframe = document.querySelector('iframe');

						// Dispatch the command
						switch (e.data.data) {
							case 'reload-window': {
								iframe.src = iframe.src;
								break;
							}
							case 'navigate-back': {
								history.back();
								break;
							}
							case 'navigate-forward': {
								history.forward();
								break;
							}
						}
					});
				</script>
			</head>
			<body>
				<iframe src="${uri.toString()}"></iframe>
			</body>
		</html>`);
	}
}
