# Ultra Enhanced Related List

<a href="https://githubsfdeploy.herokuapp.com?owner=Coding-With-The-Force&repo=Ultra_Enhanced_Related_List&ref=main" target="_blank">
  <img alt="Deploy to Salesforce"
       src="https://raw.githubusercontent.com/afawcett/githubsfdeploy/master/deploy.png">
</a>

Are you constantly frustrated by the limitations of related lists? Well this hopes to be the answer for you! With this component you can drop a related list on any page layout and it will allow you to do mass updates, mass deletes, pagination, searching and so much more! Read below for the list of features and limitations.

![ultra enhanced related list image](https://github.com/Coding-With-The-Force/Ultra_Enhanced_Related_List/blob/main/readme_images/Ultra_Enhanced_Related_Lists.PNG?raw=true)



Tutorial video, instructions on how to install and more will be here soon.

# Supported Features:
1) Mass Edits (only works for fields directly on the object currently)
2) Mass Deletes
3) Editing records related to the records in the related list
4) Pagination
5) Selective Searching
6) Selective Sorting
7) View only modal
8) New record creation (single record at a time)
9) Changing the amount of records show in the table at once (current limit 1k records).
10) Communication with Aura Components using the included application aura event 

# Features to be added in future releases:
1) Adding picklists and lookups to the table for editing.
2) Being able to mass edit fields on related objects from within the table.
3) Dynamically rendering the checkboxes and table numbers when they aren't wanted.
4) Dynamically rendering the right icon for different objects instead of just the standard record icon.
5) Figuring out how to load more than 1k records into the table without SF having a panic attack.

# Current code related improvements on the list:
1) Creating a generic test class
2) Refactoring the mass update code to make it even more generic and faster
3) Documentation/Comments
4) Improving error handling

