/**
 * Created by gerry on 3/8/2021.
 */

({
	doInit : function(component, event, helper){
		helper.getObjectLabel(component, component.get("v.relatedObjectName"), "v.relatedObjectLabel");
		helper.getObjectLabel(component, component.get("v.editableRelatedObjectType"), "v.editableRelatedObjectLabel");
	},

	doToastRefresh : function(component, event, helper) {
		const relatedObjectName = component.get("v.editableRelatedObjectLabel");
		const objectName = component.get("v.relatedObjectLabel");
		let templateData = event.getParam("messageTemplateData");
		if(templateData) {
			templateData.forEach(message => {
				console.log('This is the message ::: ' + typeof message);
				if ((message && typeof message == 'string') && ((objectName && message.toUpperCase().includes(objectName.toUpperCase())) ||
					(relatedObjectName && message.toUpperCase().includes(relatedObjectName.toUpperCase())))) {
					component.find("enhanced_list").getTableData();
				}
			});
		}
	},

	doTableRefresh : function(component, event, helper){
		component.find("enhanced_list").getTableData();
	}
})