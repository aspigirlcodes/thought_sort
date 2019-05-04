var slideCount = 0
var menu_button = document.getElementById( 'menu-toggle' )
menu_button.onclick = toggle_menu
document.getElementById('add-text-button').onclick = add_text
document.getElementById('delete-menu').onclick = delete_all
document.getElementById('share-menu').onclick = share_thoughts

display_thoughts()

if ("serviceWorker" in navigator){
  navigator.serviceWorker.register("serviceworker.js")
    .then(function(registration){
      console.log("Service Worker registered with schope:", registration.scope)
    }).catch(function(err){
      console.log("Service Worker registration failed:", err)
    })
}

function display_thoughts(){
  getThoughts(function(thoughts) {
    var container = document.getElementById('input')
    container.innerHTML = ""
    for (thought of thoughts) {
      var div = document.createElement('div')
      div.className = "thought-block"
      div.innerHTML = `<p>${thought.text}</p>`
      container.appendChild(div)
      
      var mc = new Hammer(div)
      mc.get('swipe').set({ direction: Hammer.DIRECTION_UP })
      mc.on("swipeup", add_to_thread)
    }
    slideCount = thoughts.length
    var mc = new Hammer(container)
    mc.on("pan", slide)
  })
}

function slide(ev){
  var percentage = 100 / slideCount * ev.deltaX / window.innerWidth; 
  ev.target.style.transform = 'translateX(' + percentage + '%)'; 
}

function add_to_thread(ev){
  var div = ev.target
  var clone = div.cloneNode(true)
  var mc = new Hammer(clone)
  mc.on("swiperight", remove_from_thread)
  document.getElementById("display").appendChild(clone)
  
}

function remove_from_thread(ev){
  var div = ev.target
  div.parentNode.removeChild(div);
  
}

function add_text() {
  var text = document.getElementById('inputText')
  if (text.value){
    var thoughts = text.value.split("\n\n")
    for (var thought of thoughts){
      addToObjectStore("thoughts", {'text': thought})
    }
    
  }
  text.value = ""
  display_thoughts()
}

function delete_all() {
  getThoughts(function(thoughts) {
    for (thought of thoughts) {
      deleteFromObjectStore("thoughts", thought.id)
    }
    var container = document.getElementById('input')
    container.innerHTML = ""
    slideCount = 0
  })
  
}

function share_thoughts(){
  toggle_menu()
  var currentDate = new Date()

  var date = currentDate.getDate()
  var month = currentDate.getMonth() //Be careful! January is 0 not 1
  var year = currentDate.getFullYear()

  var dateString = date + "-" +(month + 1) + "-" + year
  var display = document.getElementById("display")
  var messages = display.getElementsByClassName("thought-block")
  var text = ""
  for (var message of messages){
    text += message.innerText + "\n\n"
  }
  if (navigator.share) {
    navigator.share({
      title: 'Thoughts from ' + dateString,
      text: text,
    })
    .then(() => console.log('Successful share'))
    .catch((error) => console.log('Error sharing', error))
  } else {
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', "thoughts_" + dateString + ".txt");

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
  }
  
}

function toggle_menu() {
  // Toggle class "opened". Set also aria-expanded to true or false.
  if ( -1 !== menu_button.className.indexOf( 'opened' ) ) {
    close_menu()
  } else {
    open_menu()
  }
}

function open_menu() {
  menu_button.className += ' opened'
  menu_button.setAttribute( 'aria-expanded', 'true' )
  document.getElementById('nav-menu').classList.add('active')
}

function close_menu() {
  menu_button.className = menu_button.className.replace( ' opened', '' )
  menu_button.setAttribute( 'aria-expanded', 'false' )
  document.getElementById('nav-menu').classList.remove('active')
}
 
