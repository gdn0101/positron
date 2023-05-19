/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2023 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./positronModalPopup';
import * as React from 'react';
import { PropsWithChildren, useCallback, useEffect, useRef, useState } from 'react'; // eslint-disable-line no-duplicate-imports
import * as DOM from 'vs/base/browser/dom';
import { positronClassNames } from 'vs/base/common/positronUtilities';

/**
 * Event aliases.
 */
type UIEvent = globalThis.UIEvent;
type MouseEvent = globalThis.MouseEvent;
type KeyboardEvent = globalThis.KeyboardEvent;
type Position = DOM.IDomPosition;

/**
 * PopupPosition type.
 */
export type PopupPosition = 'top' | 'bottom';

/**
 * PopupAlignment type.
 */
export type PopupAlignment = 'left' | 'right';

/**
 * PositronModalPopupProps interface.
 */
export interface PositronModalPopupProps {
	anchorElement: HTMLElement;
	popupPosition: PopupPosition;
	popupAlignment: PopupAlignment;
	width: number;
	height: number;
	accept?: () => void;
	cancel?: () => void;
}

/**
 * PositronModalPopup component.
 * @param props A PositronModalPopupProps that contains the component properties.
 * @returns The rendered component.
 */
export const PositronModalPopup = (props: PropsWithChildren<PositronModalPopupProps>) => {
	/**
	 * Computes the popup position.
	 * @returns The popup position.
	 */
	const computePosition = (): Position => {
		const topLeftOffset = DOM.getTopLeftOffset(props.anchorElement);
		return {
			top: props.popupPosition === 'top' ?
				topLeftOffset.top - props.height - 1 :
				topLeftOffset.top + props.anchorElement.offsetHeight + 1,
			left: props.popupAlignment === 'left' ?
				topLeftOffset.left :
				topLeftOffset.left + props.anchorElement.offsetWidth - props.width
		};
	};

	// Reference hooks.
	const popupContainerRef = useRef<HTMLDivElement>(undefined!);
	const popupRef = useRef<HTMLDivElement>(undefined!);

	// State hooks.
	const [position, setPosition] = useState<Position>(computePosition());

	// Memoize the keydown event handler.
	const keydownHandler = useCallback((e: KeyboardEvent) => {
		/**
		 * Consumes an event.
		 */
		const consumeEvent = () => {
			e.preventDefault();
			e.stopPropagation();
		};

		// Handle the event.
		switch (e.key) {
			// Enter accepts dialog.
			case 'Enter':
				consumeEvent();
				props.accept?.();
				break;

			// Escape cancels dialog.
			case 'Escape':
				consumeEvent();
				props.cancel?.();
				break;

			// Allow tab so the user can set focus to the UI elements in the
			// modal dialog.
			case 'Tab':
				break;

			// Eat other keys.
			// TODO@softwarenerd - For the moment, this appears to be the right
			// way to handle keyboard events in Positron modal dialog boxes
			// insofar as we need the rest of the UI (e.g. F1 for the command
			// palette) to be disabled when a modal dialog is being shown. I am
			// certain there is more work to be done here.
			default:
				consumeEvent();
				break;
		}
	}, []);

	// Memoize the mousedownHandler.
	const mousedownHandler = useCallback((e: MouseEvent) => {
		if (!popupContainsMouseEvent(e)) {
			props.cancel?.();
		}
	}, []);

	// Memoize the resizeHandler.
	const resizeHandler = useCallback((e: UIEvent) => {
		setPosition(computePosition());
		// const topLeftOffset = DOM.getTopLeftOffset(props.anchorElement);
		// setLeft(topLeftOffset.left + props.anchorElement.offsetWidth - props.width);
		// setTop(topLeftOffset.top + props.anchorElement.offsetHeight);
	}, []);

	/**
	 * Checks whether the specified mouse event happened within the popup.
	 * @param e The mouse event.
	 * @returns A value which indicates whether the specified mouse event happened within the popup.
	 */
	const popupContainsMouseEvent = (e: MouseEvent) => {
		const clientRect = popupRef.current.getBoundingClientRect();
		return e.clientX >= clientRect.left && e.clientX <= clientRect.right &&
			e.clientY >= clientRect.top && e.clientY <= clientRect.bottom;
	};

	// Initialization.
	useEffect(() => {
		// Add our event handlers.
		const KEYDOWN = 'keydown';
		const MOUSEDOWN = 'mousedown';
		const RESIZE = 'resize';
		document.addEventListener(KEYDOWN, keydownHandler, true);
		window.addEventListener(MOUSEDOWN, mousedownHandler, false);
		window.addEventListener(RESIZE, resizeHandler, false);

		// Drive focus to the popup.
		popupContainerRef.current.focus();

		// Return the cleanup function that removes our event handlers.
		return () => {
			document.removeEventListener(KEYDOWN, keydownHandler, true);
			window.removeEventListener(MOUSEDOWN, mousedownHandler, false);
			window.removeEventListener(RESIZE, resizeHandler, false);
		};
	}, []);

	// Create the class names.
	const classNames = positronClassNames(
		'positron-modal-popup',
		props.popupPosition === 'top' ? 'shadow-top' : 'shadow-bottom'
	);

	// Render.
	return (
		<div className='positron-modal-popup-shadow-container'>
			<div ref={popupContainerRef} className='positron-modal-popup-container' role='dialog' tabIndex={-1}>
				<div ref={popupRef} className={classNames} style={{ top: position.top, left: position.left, width: props.width, height: props.height }}>
					{props.children}
				</div>
			</div>
		</div>
	);
};
