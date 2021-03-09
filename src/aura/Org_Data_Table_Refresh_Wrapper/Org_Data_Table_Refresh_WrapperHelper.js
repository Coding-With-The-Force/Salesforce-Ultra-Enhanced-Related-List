/**
 * Created by gerry on 3/8/2021.
 */

({
	getObjectLabel : function(component, objectAPIName, variableToSet){
		let findObjectName = component.get("c.getObjectLabel");
		findObjectName.setParams({"objectAPIName" : objectAPIName});
		findObjectName.setCallback(this, function (response) {
			const state = response.getState();
			if(state === 'SUCCESS'){
				component.set(variableToSet, response.getReturnValue());
			}
			else{
				const errors = response.getError();
				if(errors){
					console.error('There was an error retrieving the object label ::: ' + errors[0].message);
				}
			}
		});
		$A.enqueueAction(findObjectName);
	}
});