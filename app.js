var slideCount = 0
var activeSlide = 0
var menu_button = document.getElementById( 'menu-toggle' )
var input = document.getElementById('input')
var mc = new Hammer(input)
mc.on("pan", slide)

menu_button.onclick = toggle_menu
document.getElementById('add-text-button').onclick = add_text
document.getElementById('delete-text-button').onclick = delete_all
document.getElementById('clear-menu').onclick = clear_thoughts
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
    input.innerHTML = ""
    var texts = []
    for (thought of thoughts) {
      texts.push(thought.text)
      var div = document.createElement('div')
      div.className = "thought-block"
      div.innerHTML = `<p>${thought.text}</p>`
      input.appendChild(div)
      
      var mc = new Hammer(div)
      mc.get('swipe').set({ direction: Hammer.DIRECTION_UP })
      mc.on("swipeup", add_to_thread)
    }
    slideCount = thoughts.length
    input.style.width = "" + slideCount * 100 + "%"
    var text = texts.join("\n\n")
    document.getElementById('inputText').value = text
  })
}

function slide(ev){
  var percentage = 100 / slideCount * ev.deltaX / window.innerWidth
  var transformPercentage = percentage - 100 / slideCount * activeSlide
  input.style.transform = 'translateX(' + transformPercentage + '%)'
  if(ev.isFinal) {
    if(percentage < 0)
      goToSlide(activeSlide + 1)
    else if(percentage > 0)
      goToSlide(activeSlide - 1)
    else
      goToSlide(activeSlide)
  }
}

function goToSlide(number) {
  if(number < 0)
    activeSlide = 0
  else if(number > slideCount - 1)
    activeSlide = slideCount - 1
  else
    activeSlide = number
  console.log(activeSlide)  
  var percentage = -(100 / slideCount) * activeSlide
  input.style.transform = 'translateX(' + percentage + '%)'
}

function add_to_thread(ev){
  if (ev.target.classList.contains("thought-block")) 
    var div = ev.target
  else 
    var div = ev.target.parentNode
    
  var clone = div.cloneNode(true)
  var mc = new Hammer(clone)
  mc.on("swiperight", remove_from_thread)
  document.getElementById("display").appendChild(clone)
  div.scrollIntoView(false)
  
}

function remove_from_thread(ev){
  if (ev.target.classList.contains("thought-block")) 
    var div = ev.target
  else 
    var div = ev.target.parentNode
  div.parentNode.removeChild(div);
  
}

function add_text() {
  getThoughts(function(thoughts) {
    for (thought of thoughts) {
      deleteFromObjectStore("thoughts", thought.id)
    }
    input.innerHTML = ""
    slideCount = 0
    var text = document.getElementById('inputText')
    if (text.value){
      var thoughts = text.value.split("\n\n")
      for (var thought of thoughts){
        thought = thought.trim()
        addToObjectStore("thoughts", {'text': thought})
      }
    }
    text.value = ""
    display_thoughts()
    close_menu()
  })
}

function delete_all() {
  getThoughts(function(thoughts) {
    for (thought of thoughts) {
      deleteFromObjectStore("thoughts", thought.id)
    }
    input.innerHTML = ""
    slideCount = 0
    document.getElementById('inputText').value = ""
  })
}

function clear_thoughts(){
  toggle_menu()
  document.getElementById('display').innerHTML = ""
  
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
 
