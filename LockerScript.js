function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var items=[];
var item=null;
var itemIndex=0;
var listItems=[];
var category=null;
var currentListItem=null;
var currentDialog=null;
var depth=0;
var lastSave=null;
var pin='';
var keyCode=null;
var unlocked=false;
var dragStart={};
// DRAG TO CHANGE DEPTH
id('main').addEventListener('touchstart', function(event) {
    // console.log(event.changedTouches.length+" touches");
    dragStart.x=event.changedTouches[0].clientX;
    dragStart.y=event.changedTouches[0].clientY;
})
id('main').addEventListener('touchend', function(event) {
    var drag={};
    drag.x=dragStart.x-event.changedTouches[0].clientX;
    drag.y=dragStart.y-event.changedTouches[0].clientY;
    if(Math.abs(drag.y)>50) return; // ignore vertical drags
    if((drag.x<-50)&&(depth>0)) { // drag right to decrease depth...
        category=null;
        depth=0;
        loadListItems();
    }
    else if((drag.x>50)&&(currentDialog)) showDialog(currentDialog,false); // drag left to close dialogs
})
// TAP ON HEADER
id('heading').addEventListener('click',function() {
	if(depth>0) { // list heading - show item edit dialog
		id(listField.value=list.name);
		console.log('edit list header - '+items.length+' items');
		for(var i in items) console.log('item '+i+': '+items[i].text);
		if(items.length>0) {
			id('deleteListButton').style.display='none';
			console.log('disable delete');
		}
		else id('deleteListButton').style.display='block';
		id('listAddButton').style.display='none';
		id('listSaveButton').style.display='block';
		showDialog('listDialog',true);
	}
	else showDialog('dataDialog',true);
});
// DISPLAY MESSAGE
function display(message) {
	id('message').innerText=message;
	showDialog('messageDialog',true);
}
// SHOW/HIDE DIALOG
function showDialog(dialog,show) {
    console.log('show '+dialog+': '+show);
    if(currentDialog) id(currentDialog).style.display='none';
    if(show) {
        id(dialog).style.display='block';
        currentDialog=dialog;
        id('buttonNew').style.display='none';
    }
    else {
        id(dialog).style.display='none';
        currentDialog=null;
        id('buttonNew').style.display='block';
    }
}
// ADD ITEMS
id('buttonNew').addEventListener('click', function(){
	item={};
    if(depth<1) { // top level - can only add lists
    	id('listField').value='';
    	id('deleteListButton').style.display='none';
    	id('listAddButton').style.display='block';
    	id('listSaveButton').style.display='none';
        showDialog('listDialog',true);
    }
    else { // lower level: can only add notes
    	id('noteField').value='';
    	id('deleteNoteButton').style.display='none';
    	id('noteAddButton').style.display='block';
    	id('noteSaveButton').style.display='none';
        showDialog('noteDialog',true);
    }
})
id('addListButton').addEventListener('click',function() {
	id('listField').value='';
    id('deleteListButton').style.display='none';
    id('listAddButton').style.display='block';
	id('listSaveButton').style.display='none';
    showDialog('listDialog',true);
})
id('addNoteButton').addEventListener('click',function() {
    showDialog('noteDialog',true);
})
// LIST
id('listAddButton').addEventListener('click', function() { // SPLIT INTO ADD AND SAVE FUNCTIONS
    item={};
    item.owner=list.id; // NEW
    // NO LONGER USE type -USE DEPTH INSTEAD item.type=1;
    item.text=cryptify(id('listField').value,keyCode);
    console.log('encrypt to '+item.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var addRequest=dbObjectStore.add(item);
	addRequest.onsuccess=function(event) {
		console.log('new list added');
		showDialog('listDialog',false);
		loadListItems();
	}
	 addRequest.onerror=function(event) {cosnole.log('error adding new list');}
})
id('listSaveButton').addEventListener('click', function() {
	list.text=cryptify(id('listField').value,keyCode);
    console.log('encrypt to '+list.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
    var putRequest=dbObjectStore.put(list); // WAS var putRequest=dbObjectStore.put(data);
	putRequest.onsuccess=function(event) {
		console.log('item '+list.index+" updated");
		showDialog('listDialog',false);
        loadListItems();
	};
	putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
})
id('deleteListButton').addEventListener('click',function() {
	if(items.length>0) {
		display('CAN ONLY DELETE EMPTY LISTS');
		return;
	}
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready to delete list item");
	console.log('delete list item '+itemIndex+' id: '+list.id); // items[itemIndex].id);
	var delRequest=dbObjectStore.delete(list.id); // items[itemIndex].id);
	delRequest.onsuccess=function() {
	    console.log('deleted from database');
	    showDialog('listDialog',false);
        depth=0;
        list.id=list.owner=null;
        console.log('list.id: '+list.id+' depth: '+depth);
        loadListItems();
	    
	}
	delRequest.onerror=function(event) {console.log('delete failed')};
    items.splice(itemIndex,1);
    console.log("delete complete");
    populateList();
    itemIndex=null;
    currentListItem=null;
})
// NOTE
id('deleteNoteButton').addEventListener('click', function() {
	var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready to delete item");
	console.log('delete item '+itemIndex+' id: '+items[itemIndex].id);
	var delRequest=dbObjectStore.delete(items[itemIndex].id);
	delRequest.onsuccess=function() {
	    console.log('deleted from database');
	    showDialog('noteDialog',false);
	}
	delRequest.onerror=function(event) {console.log('delete failed')};
    items.splice(itemIndex,1);
    console.log("delete complete");
    populateList();
    itemIndex=null;
    currentListItem=null;
})
id('noteAddButton').addEventListener('click', function() {
    item={};
    item.owner=list.id;
    item.text=cryptify(id('noteField').value,keyCode);
    // console.log("encrypted note: "+item.text);
    console.log('ADD new item (owner: '+item.owner+') to list '+list.id+': '+list.name);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
    var addRequest=dbObjectStore.add(item);
	addRequest.onsuccess=function(event) {
		item.id=event.target.result;
		console.log("new item added - id is "+item.id);
		showDialog('noteDialog',false);
    	itemIndex=null;
    	currentListItem=null;
    	loadListItems();
	}
	addRequest.onerror=function(event) {console.log("error adding new item");};
    
})
id('noteSaveButton').addEventListener('click', function() {
	item.text=cryptify(id('noteField').value,keyCode);
    console.log("encrypted note: "+item.text);
    var dbTransaction=db.transaction('items',"readwrite");
	var dbObjectStore=dbTransaction.objectStore('items');
	console.log("database ready");
	var putRequest=dbObjectStore.put(item);
	putRequest.onsuccess=function(event) {
		console.log('item updated');
		showDialog('noteDialog',false);
    	itemIndex=null;
    	currentListItem=null;
    	loadListItems();
	};
	putRequest.onerror=function(event) {console.log("error updating item "+item.index);};
})
// POPULATE LIST
function populateList(decrypt) {
    var listItem;
    console.log('first listItem is '+listItems[0].text);
    id("list").innerHTML=""; // clear list
	console.log("populate list with "+listItems.length + " items - depth: "+depth);
	listItems.sort(function(a,b){ // sort alphabetically
		if(a.text.toUpperCase()<b.text.toUpperCase()) return -1;
		if(a.text.toUpperCase()>b.text.toUpperCase()) return 1;
		return 0;
	});
	for(var i in listItems) {
	    console.log('add item '+i+': '+listItems[i].text);
	    // all items have text
		listItem=document.createElement('li');
		listItem.index=i;
	 	listItem.innerText=listItems[i].text;
		if(depth<1) { // tap on category to open it
		    listItem.addEventListener('click',function() {
	 	    	itemIndex=this.index;
	 	    	console.log('open item '+itemIndex);
		    	category=listItems[this.index].code;
		    	console.log('open list '+listItems[this.index].text);
		    	depth++;
		    	loadListItems();
	 		});
		    listItem.style.fontWeight='bold'; // lists are bold
		}
		else { // tap on note to edit it
			listItem.addEventListener('click',function() {
				itemIndex=this.index;
				item=listItems[this.index];
				console.log('edit note '+i+': '+item.text);
				id('noteField').value=item.text;
				id('deleteNoteButton').style.display='block';
				id('noteAddButton').style.display='none';
				id('noteSaveButton').style.display='block';
				// console.log('should say '+item.text+'; says '+id('noteField').value);
				showDialog('noteDialog',true);
			})
		}
		id('list').appendChild(listItem);
	}
}
// LOAD LIST ITEMS
function loadListItems() {
	console.log("load notes for category "+category+" - depth: "+depth);
	if(category==null) {
		depth=0;
		id('heading').innerHTML='Locker';
	}
	else {
		depth=1;
		id('heading').innerHTML=cryptify(category,keyCode);
	}
	listItems=[];
	for(var i=0;i<items.length;i++) {
		if(items[i].category==category) {
			item={};
			item.code=items[i].text; // encrypted
			item.text=cryptify(items[i].text,keyCode);
			listItems.push(item);
		}
	}
	if(listItems.length<1) { // no data: restore backup?
		console.log("no data - restore backup?");
		showDialog('importDialog',true);
	}
	populateList(true);
}
// DATA
id('backupButton').addEventListener('click',function() {showDialog('dataDialog',false); backup();});
id('importButton').addEventListener('click',function() {showDialog('importDialog',true)});
// RESTORE BACKUP
id("fileChooser").addEventListener('change', function() {
	var file=id('fileChooser').files[0];
	console.log("file: "+file+" name: "+file.name);
	var fileReader=new FileReader();
	fileReader.addEventListener('load', function(evt) {
		console.log("file read: "+evt.target.result);
	  	var data=evt.target.result;
		var json=JSON.parse(data);
		console.log("json: "+json);
		var items=json.items;
		console.log(items.length+" items loaded");
		/* CREATE NEW DATABASE
		var categories=[];
		for(var i=0;i<items.length;i++) {
			var item={};
			if(items[i].owner===null) { // category
				var category={};
				category.id=items[i].id;
				category.text=items[i].text;
				categories.push(category);
				item.category=null;
				console.log('item '+i+' is a category item');
			}
			else { // note
				var found=false;
				var j=0;
				while(j<categories.length && !found) {
					if(categories[j].id==items[i].owner) {
						found=true;
						item.category=categories[j].text;
						console.log('item '+i+' is a note item in category '+item.category);
					}
					else j++;
				}
				if(!found) console.log('NO CATEGORY MATCH');
			}
			item.text=items[i].text;
			items[i]=item;
		}
		*/
		var data=JSON.stringify(items);
		window.localStorage.setItem('items',data);
		showDialog('importDialog',false);
		display("data imported - restart");
  	});
  	fileReader.readAsText(file);
});
// BACKUP
function backup() {
  	console.log("EXPORT");
	var fileName="LockerData.json";
	console.log(items.length+" items - save");
	var data={'items': items};
	var json=JSON.stringify(data);
	var blob=new Blob([json], {type:"data:application/json"});
  	var a=document.createElement('a');
	a.style.display='none';
    var url=window.URL.createObjectURL(blob);
	console.log("data ready to save: "+blob.size+" bytes");
   	a.href=url;
   	a.download=fileName;
    document.body.appendChild(a);
    a.click();
	display(fileName+" saved to downloads folder");
}
// ENCRYPT/DECRYPT TEXT USING KEY
function cryptify(value,key) {
	var i=0;
	var result="";
	var k;
	var v;
	for (i=0;i<value.length;i++) {
		k=key.charCodeAt(i%key.length);
		v=value.charCodeAt(i);
		result+=String.fromCharCode(k ^ v);
	}
	return result;
};
// KEY CHECK
function tapKey(n) {
	if(n=='<') {
		console.log('BACKSPACE');
		var l=pin.length;
		if(l>0) pin=pin.substr(0,l-1);
		console.log('pin: '+pin);
		id('pinField').innerHTML='';
		while(l>1) {
			id('pinField').innerHTML+='*';
			l--;
		}
		return false;
	}
	pin+=n;
	id('pinField').innerHTML+='*';
	console.log('pin: '+pin);
	if(pin.length>3) { // 4 digits entered
		console.log("keyCode: "+keyCode);
		console.log("check: "+id('keyCheck').value);
		if(keyCode===null) { // set keyCode - step 1
			keyCode=pin;
			id('keyCheck').value=pin;
			id('pinField').innerText='';
			pin='';
			id('keyTitle').innerText='confirm PIN';
        	return;
    	}
    	else if(pin==id('keyCheck').value) { // set keyCode step 2 or unlock
        	window.localStorage.keyCode=cryptify(pin,'secrets');
        	unlocked=true;
        	showDialog('keyDialog',false);
        	loadListItems();
        	return true;
    	}
    	else {
    		id('pinField').innerText='';
			pin='';
    	}
	}
}  
// START-UP CODE
keyCode=window.localStorage.keyCode; // load any saved key
console.log("saved key: "+keyCode);
if(!keyCode) { // first use - set a PIN
	console.log('set new PIN');
    keyCode=null;
    id('keyTitle').innerText='set a PIN';
    id('pinField').innerText='';
    pin='';
    showDialog('keyDialog',true);
}
else { // start-up - enter PIN
	console.log('encrypted keyCode: '+keyCode);
	keyCode=cryptify(keyCode,'secrets'); // saved key was encrypted
	console.log("decoded keyCode: "+keyCode);
	id('keyTitle').innerText='PIN';
	id('pinField').innerText='';
	pin='';
    id('keyCheck').value=keyCode;
    showDialog('keyDialog',true);
}
var data=window.localStorage.getItem('items');
items=JSON.parse(data);
console.log(items.length+' items loaded');
list.category=null;
depth=0;
// implement service worker if browser is PWA friendly
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
} else { //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js', {
		scope: '/Locker/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}