/**
 * Created by gerry on 2/21/2021.
 */

import {LightningElement, api} from 'lwc';

export default class DatatablePicklistCell extends LightningElement {

	@api label;
	@api placeholder;
	@api options;
	@api value;
	@api context;
	@api editable;

	connectedCallback() {
		console.log('These are the options ::: ' + JSON.stringify(this.options));
	}

	handleChange(event) {
		console.log('This is the picklist event happening :::');
		//show the selected value on UI
		this.value = event.detail.value;

		//fire event to send context and selected value to the data table
		this.dispatchEvent(new CustomEvent('picklistchanged', {
			composed: true,
			bubbles: true,
			cancelable: true,
			detail: {
				data: { context: this.context, value: this.value }
			}
		}));
	}
}