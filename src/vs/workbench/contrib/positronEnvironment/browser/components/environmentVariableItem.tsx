/*---------------------------------------------------------------------------------------------
 *  Copyright (C) 2022 Posit Software, PBC. All rights reserved.
 *--------------------------------------------------------------------------------------------*/

import 'vs/css!./environmentVariableItem';
import * as React from 'react';
import { useState } from 'react'; // eslint-disable-line no-duplicate-imports
import { positronClassNames } from 'vs/base/common/positronUtilities';
import { ColumnSplitter } from 'vs/workbench/contrib/positronEnvironment/browser/components/columnSplitter';
import { IEnvironmentVariableItem } from 'vs/workbench/services/positronEnvironment/common/interfaces/environmentVariableItem';
import { IPositronEnvironmentInstance } from 'vs/workbench/services/positronEnvironment/common/interfaces/positronEnvironmentService';

/**
 * EnvironmentVariableItemProps interface.
 */
export interface EnvironmentVariableItemProps {
	nameColumnWidth: number;
	detailsColumnWidth: number;
	typeVisible: boolean;
	environmentVariableItem: IEnvironmentVariableItem;
	positronEnvironmentInstance: IPositronEnvironmentInstance;

	onStartResizeNameColumn: () => void;
	onResizeNameColumn: (x: number, y: number) => void;
	onStopResizeNameColumn: (x: number, y: number) => void;
}

/**
 * EnvironmentVariableItem component.
 * @param props A EnvironmentVariableItemProps that contains the component properties.
 * @returns The rendered component.
 */
export const EnvironmentVariableItem = (props: EnvironmentVariableItemProps) => {
	// Hooks.
	const [selected, _setSelected] = useState(false);

	/**
	 * Handles expand / collapse.
	 */
	const handleExpandCollapse = async (): Promise<void> => {
		if (props.environmentVariableItem.expanded) {
			props.positronEnvironmentInstance.collapseEnvironmentVariable(
				props.environmentVariableItem.path
			);
		} else {
			await props.positronEnvironmentInstance.expandEnvironmentVariable(
				props.environmentVariableItem.path
			);
		}
	};

	// Create the class names.
	const classNames = positronClassNames(
		'environment-variable',
		{ 'selected': selected }
	);

	// Render.
	return (<>
		<div className={classNames}>
			<div className='name' style={{ width: props.nameColumnWidth }}>
				<div style={{ display: 'flex', marginLeft: props.environmentVariableItem.indentLevel * 20 }}>
					<div className='gutter'>
						{props.environmentVariableItem.hasChildren && (
							<button className='expand-collapse-button' onClick={handleExpandCollapse}>
								{!props.environmentVariableItem.expanded ?
									<div className={`expand-collapse-button-icon codicon codicon-chevron-right`}></div> :
									<div className={`expand-collapse-button-icon codicon codicon-chevron-down`}></div>
								}
							</button>
						)}
					</div>
					<div className='name-value'>
						{props.environmentVariableItem.displayName}
					</div>
				</div>
			</div>
			<ColumnSplitter
				onStartResize={props.onStartResizeNameColumn}
				onResize={props.onResizeNameColumn}
				onStopResize={props.onStopResizeNameColumn} />
			<div className='details' style={{ width: props.detailsColumnWidth }}>
				<div className='value'>{props.environmentVariableItem.displayValue}</div>
				{props.typeVisible && (
					<div className='type'>
						{props.environmentVariableItem.displayType}
					</div>
				)}
			</div>
		</div>
	</>);
};
