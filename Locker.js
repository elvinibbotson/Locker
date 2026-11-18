function id(el) {
	return document.getElementById(el);
}
'use strict';
// GLOBAL VARIABLES	
var items=[];
var item=null;
var categories=[];
var category=null;
var itemIndex=0;
var listItems=[];
var listItem=null;
var currentDialog=null;
var pin='';
var keyCode=null;
var dragStart={};
var syncDay; // last sync
var latest; // last change
// solid session & authentication...
const auth=solidClientAuthentication;
const session=auth.getDefaultSession();
// DRAG TO RETURN TO CATEGORY LIST
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
    if((drag.x<-50)&&category) {
        category=null;
        listCategories();
    }
})
// TAP ON HEADER
id('buttonSync').addEventListener('click',connect);
// CLOSE DIALOG
id('curtain').addEventListener('click',function() {
	showDialog(currentDialog,false);
})
// SHOW/HIDE DIALOG
function showDialog(dialog,show) {
    // console.log('show '+dialog+': '+show);
    if(currentDialog) id(currentDialog).style.display='none';
    if(show) {
        id(dialog).style.display='block';
        currentDialog=dialog;
        id('buttonNew').style.display='none';
        id('curtain').style.height='100%';
    }
    else {
        id(dialog).style.display='none';
        currentDialog=null;
        id('buttonNew').style.display='block';
        id('curtain').style.height='0';
    }
}
// NEW CATEGORY/NOTE
id('buttonNew').addEventListener('click', function(){
	item={};
    if(category==null) { // add new category
    	id('categoryField').value='';
    	id('addCategoryButton').style.display='block';
        showDialog('categoryDialog',true);
    }
    else { // add note
    	id('noteField').value='';
    	id('deleteNoteButton').style.display='none';
    	id('addNoteButton').style.display='block';
    	id('saveNoteButton').style.display='none';
        showDialog('noteDialog',true);
    }
})
id('addCategoryButton').addEventListener('click',function() {
	category=id('categoryField').value;
	if(category.length<1) return; // no category name
	if(categories.indexOf('category')>=0) return; // category already exists
	list.innerHTML='';
	id('header').innerText=category;
	showDialog('categoryDialog',false);
	console.log('new category - '+category);
})
id('addNoteButton').addEventListener('click', function() {
	console.log('add note '+id('noteField').value);
    item={};
    item.category=category;
    item.text=cryptify(id('noteField').value,keyCode);
    console.log('encrypted to '+item.text);
    items.push(item);
    save(); // WAS saveData();
    itemIndex=null;
    showDialog('noteDialog',false);
    listCategoryItems();
    console.log('note added');
})
// EDIT NOTE
id('saveNoteButton').addEventListener('click', function() {
	console.log('update item '+itemIndex);
	itemIndex=listItems[itemIndex].index;
	console.log('ie. item '+itemIndex);
	item={};
    item.category=category;
    item.text=cryptify(id('noteField').value,keyCode);
    console.log("encrypted note: "+item.text);
    items[itemIndex]=item;
    save(); // WAS saveData();
    console.log('note updated');
    showDialog('noteDialog',false);
    listCategoryItems();
})
id('deleteNoteButton').addEventListener('click', function() {
	console.log('delete item '+itemIndex);
	itemIndex=listItems[itemIndex].index;
	console.log('ie. item '+itemIndex);
    items.splice(itemIndex,1);
    save();
    console.log("delete complete");
    showDialog('noteDialog',false);
    listCategoryItems();
    itemIndex=null;
})
// LIST CATEGORIES
function listCategories() {
	// console.log('list '+categories.length+' categories');
	listItem;
	id("list").innerHTML=""; // clear list
	categories.sort(function(a,b){ // sort alphabetically
		if(a.toUpperCase()<b.toUpperCase()) return -1;
		if(a.toUpperCase()>b.toUpperCase()) return 1;
		return 0;
	});
	for(var i in categories) {
		// console.log('list '+categories[i]);
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=categories[i];
		listItem.addEventListener('click',function() {
			itemIndex=this.index;
			console.log('open item '+itemIndex);
			category=categories[this.index];
			console.log('list category '+categories[this.index]);
			listCategoryItems();
		});
		listItem.style.fontWeight='bold'; // lists are bold
		id('list').appendChild(listItem);
	}
	id('heading').innerText='Locker';
}
// LIST ITEMS IN CATEGORY
function listCategoryItems() {
	// console.log('list items in category '+category);
	listItems=[];
	id("list").innerHTML=""; // clear list
	for(var i in items) {
		// console.log('item '+i+' category: '+items[i].category);
		if(items[i].category==category) {
			listItem={};
			listItem.index=i;
			listItem.text=cryptify(items[i].text,keyCode);
			listItems.push(listItem);
		}
	}
	listItems.sort(function(a,b){ // sort alphabetically
		if(a.text.toUpperCase()<b.text.toUpperCase()) return -1;
		if(a.text.toUpperCase()>b.text.toUpperCase()) return 1;
		return 0;
	});
	for(i in listItems) {
		// console.log('list '+listItems[i].text);
		listItem=document.createElement('li');
		listItem.index=i;
		listItem.innerText=listItems[i].text;
		listItem.addEventListener('click',function() {
			itemIndex=this.index;
			item=listItems[this.index];
			console.log('edit note '+i+': '+item.text);
			id('noteField').value=item.text;
			id('deleteNoteButton').style.display='block';
			id('addNoteButton').style.display='none';
			id('saveNoteButton').style.display='block';
			showDialog('noteDialog',true);
		});
		id('list').appendChild(listItem);
	}
	id('heading').innerText=category;
}
// DATA
function load() {
	var data=localStorage.getItem('LockerData');
	if(!data) {
		message('No data - sync');
		return;
	}
	console.log('data: '+data.length+' bytes');
    items=JSON.parse(data);
    console.log(items.length+' items');
	categories=[];
	for(var i in items) {
		// console.log('item '+i+': '+items[i].text+'; category: '+items[i].category);
		if(categories.indexOf(items[i].category)<0) categories.push(items[i].category);
	}
	console.log(items.length+' items loaded; '+categories.length+' categories');
	category=null;
	listCategories();
}
function save() {
	var data=JSON.stringify(items);
	window.localStorage.setItem('LockerData',data);
	latest=new Date().toString();
	window.localStorage.setItem('latest',latest);
	console.log('data saved to LockerData; latest is '+latest);
}
// SOLID
function connect() {
	console.log('CONNECT - logging in');
	console.log('items: '+items.length);
	try {
		auth.login({
    		oidcIssuer:"https://privatedatapod.com",
    		redirectUrl:window.location.href,
    		clientName:"Locker"
    	});
	}
	catch(error) {console.error(error.message);}
}
auth.handleIncomingRedirect({restorePreviousSession:true}).then(function(){
	if(session.info.isLoggedIn) {
		console.log('logged in as '+session.info.webId);
		sync();
	}
});
async function sync() {
	if(!session.info.isLoggedIn) {connect(); return;} // ensure connected
	latest=window.localStorage.getItem('latest');
	console.log('latest is '+latest);
	message('SYNC - DOWNLOAD?',true);
	var response=await session.fetch('https://elvinibbotson.privatedatapod.com/drive/LockerData.json',
	{ // ONLY RESTORE DATA FROM POD IF NEWER THAN CURRENT LOCAL DATA
		method: 'GET',
		headers: {'If-Modified-Since':latest}
	});
	console.log('response: '+response.json);
	if(response.ok) {
		var body=await response.json();
		console.log('response - last modified: '+response.headers.get('Last-Modified'));
		items=body.items;
		save();
		message(items.length+' items downloaded',false);
		disconnect();
	}
	else { // local data is newer - upload to pod
		message('no download - UPLOAD',false);
		console.log('upload '+items.length+' items');
		upload();
		return;
	}
	syncDay=new Date()/86400000;
	window.localStorage.setItem('syncDay',syncDay);
	load(); // ensure working with latest dataset
}
async function upload() {
	if(!session.info.isLoggedIn) {connect(); return;} // ensure connected
  	console.log("UPLOAD");
	var fileName="drive/LockerData.json";
	console.log(items.length+" items to upload");
	if(items.length<1) { // NEW
		message('NO DATA');
		disconnect();
		return;
	}
	var data={'items': items};
	var json=JSON.stringify(data);
	try {
		response=await session.fetch('https://elvinibbotson.privatedatapod.com/'+fileName,{
			method:'PUT',
			headers:{'Content-Type':'application/json'},
			body:json
		});
		if(!response.ok) {
    		throw new Error(`Response status: ${response.status}`);
    	}
    	console.log('data uploaded, status: '+response.status);
    	message(items.length+' items uploaded');
    	syncDay=new Date()/86400000;
		window.localStorage.setItem('syncDay',syncDay);
		disconnect();
	}
	catch (error) {console.error(error.message);alert(error.message);}
}
async function disconnect() {
	var response=await session.logout({logoutType: 'app'});
	console.log('logout response: ${response.status}');
}
// DISPLAY MESSAGE
function message(text) {
	console.log('message: '+text);
	id('message').innerText=text;
	showDialog('messageDialog',true);
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
// START-UP CODE
latest=window.localStorage.getItem('latest');
if(!latest) {
	latest=new Date(0).toString(); // default to 1970
	window.localStorage.setItem('latest',latest);
}
console.log('latest change: '+latest);
syncDay=window.localStorage.getItem('syncDay');
console.log('latest sync: '+syncDay);
if(!syncDay) {
	syncDay=new Date(0)/86400000; // default to 1970
	window.localStorage.setItem('syncDay',syncDay);
}
keyCode=window.localStorage.getItem('keyCode'); // load any saved key
console.log("saved key: "+keyCode);
keyCode=cryptify(keyCode,'secrets'); // saved key was encrypted
console.log('decrypted key: '+keyCode);
load();
if(new Date()/86400000-syncDay>5) message('More than 5 days since last sync.');
// IMPLEMENT SERVICE WORKER if browser is PWA friendly
if (navigator.serviceWorker.controller) {
	console.log('Active service worker found, no need to register')
}
else
{ //Register the ServiceWorker
	navigator.serviceWorker.register('sw.js', {
		scope: '/Locker/'
	}).then(function(reg) {
		console.log('Service worker has been registered for scope:'+ reg.scope);
	});
}