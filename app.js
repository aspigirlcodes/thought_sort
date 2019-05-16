var slideCount = 0
var activeSlide = 0
var scrollParam = 0

var menu_button = document.getElementById( 'menu-toggle' )
var input = document.getElementById('input')

var mc = new Hammer(input)
mc.on("panleft panright", slide)
mc2 = new Hammer(document.body)
mc2.on("pan", redirect)
menu_button.onclick = toggle_menu
document.getElementById('add-text-button').onclick = add_text
document.getElementById('delete-text-button').onclick = delete_all
document.getElementById('clear-menu').onclick = clear_thoughts
document.getElementById('share-menu').onclick = share_thoughts

display_thoughts()
display_thread()

if ("serviceWorker" in navigator){
  navigator.serviceWorker.register("serviceworker.js")
    .then(function(registration){
      console.log("Service Worker registered with schope:", registration.scope)
    }).catch(function(err){
      console.log("Service Worker registration failed:", err)
    })
}

function display_thread(){
  if(window.location.search === "?inapp=true"){
    getItems("thread", function(thoughts){
      for (var thought of thoughts){
        var div = document.createElement("div")
        div.className = "thought-block"
        div.innerHTML = `<p>${thought.text}</p>`
        var mc = new Hammer(div)
        mc.on("swiperight", remove_from_thread)
        mc.on("press", add_sort_event)
        mc.on("pan", sort)
        mc.get("pan").set({ direction: Hammer.DIRECTION_VERTICAL , enable: canEnable})
        mc.on("pressup", stop_sort)
        document.getElementById("display").appendChild(div)
        deleteFromObjectStore("thread", thought.id)
      }
    })
  }else{
    getItems("thread", function(thoughts) {
      for (var thought of thoughts) {
        deleteFromObjectStore("thread", thought.id)
      }
    })
  }
}

function display_thoughts(){
  getItems("thoughts", function(thoughts) {
    input.innerHTML = ""
    var texts = []
    for ( var thought of thoughts) {
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
    input.style.transform = 'translateX(0%)'
    activeSlide = 0
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
  var percentage = -(100 / slideCount) * activeSlide
  input.style.transform = 'translateX(' + percentage + '%)'
}

function add_to_thread(ev){
  var div = getDiv(ev.target)
  var clone = div.cloneNode(true)
  var mc = new Hammer(clone)
  mc.on("swiperight", remove_from_thread)
  mc.on("press", add_sort_event)
  mc.get("pan").set({ direction: Hammer.DIRECTION_VERTICAL , enable: canEnable})
  mc.on("pan", sort)
  mc.on("pressup", stop_sort)
  document.getElementById("display").appendChild(clone)
  div.scrollIntoView(false)
  
}

function getDiv(target){
  if (target.classList.contains("thought-block")) 
    return target
  else 
    return target.parentNode
}

function canEnable(rec, input){
  var div = getDiv(rec.manager.element)
  return div.classList.contains("panable")
}

function remove_from_thread(ev){
  var div = getDiv(ev.target)
  div.parentNode.removeChild(div);
}

function add_sort_event(ev){
  var div = getDiv(ev.target)
  div.style.marginLeft = "5px"
  div.style.marginTop = "5px"
  div.style.backgroundColor = "#333333"
  div.style.zIndex = 100
  div.classList.add('panable')
}
function sort(ev){
  if(ev.srcEvent.type === 'pointercancel') return //chrome hack https://github.com/hammerjs/hammer.js/issues/1050
  ev.preventDefault() // prevent scrolling in firefox
  var div = getDiv(ev.target)
  div.style.transform = 'translateY(' + (ev.deltaY + scrollParam) + 'px)' 
  var scrollMaxY = window.scrollMaxY || (Math.max( document.body.scrollHeight, document.body.offsetHeight, 
                     document.documentElement.clientHeight, document.documentElement.scrollHeight, 
                     document.documentElement.offsetHeight ) - window.innerHeight)
  if (ev.center.y < 25 && window.scrollY > 0){
    window.scrollBy(0, -5)
    scrollParam -= 5
  } else if (ev.center.y > (window.innerHeight - 25) && window.scrollY < scrollMaxY){
    window.scrollBy(0, 5)
    scrollParam += 5
  }
  if(ev.isFinal) {
    div.style = ""
    div.classList.remove('panable')
    scrollParam = 0
    var targetDiv = getDiv(document.elementFromPoint(ev.center.x, ev.center.y))
    if (targetDiv.classList.contains("thought-block") && targetDiv.parentNode.id === "display")
      div.parentNode.insertBefore(div, targetDiv)
    else 
      document.getElementById("display").appendChild(div)  
  } 
  
  
}

function stop_sort(ev){
  if(ev.srcEvent.type === 'pointercancel') return //chrome hack https://github.com/hammerjs/hammer.js/issues/1050
  var div = getDiv(ev.target)
  if(ev.isFinal) {
    div.style = ""
    div.classList.remove('panable')
    scrollParam = 0
  }
}

function add_text() {
  getItems("thoughts", function(thoughts) {
    for (var thought of thoughts) {
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
  getItems("thoughts", function(thoughts) {
    for (var thought of thoughts) {
      deleteFromObjectStore("thoughts", thought.id)
    }
    input.innerHTML = ""
    slideCount = 0
    document.getElementById('inputText').value = ""
  })
}

function clear_thoughts(){
  close_menu()
  items = document.getElementById('display').getElementsByClassName("thought-block")
  while(items.length > 0 ){
    items[0].parentNode.removeChild(items[0])
  }  
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

function redirect(ev){
  if (ev.center.y < window.innerHeight * 2 / 3 && ev.center.y > window.innerHeight / 3){
    if (ev.center.x - ev.deltaX > window.innerWidth * 3 / 4){
      document.body.style.transform = 'translateX(' + ev.deltaX + 'px)'
    }
    if (ev.isFinal) {
      if (ev.center.x < window.innerWidth / 4 && ev.deltaX < - window.innerWidth * 3 / 4){
        items = document.getElementById("display").getElementsByClassName("thought-block")
        if (items.length > 0){
          for (var i = 0; i < items.length - 1; i++) {
            addToObjectStore("thread", {"text": items[i].getElementsByTagName("p")[0].innerHTML})
          }
          addToObjectStore("thread", {"text": items[items.length-1].getElementsByTagName("p")[0].innerHTML}, function(){
            window.location.href = "https://aspigirlcodes.github.io/easy_list/" + window.location.search
          })
        } else {
          window.location.href = "https://aspigirlcodes.github.io/easy_list/" + window.location.search
        }
        
      } else {
        document.body.style.transform =  ''
      }
    }
  }
  
  
} 
