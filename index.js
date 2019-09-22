//variable declarations
const MAIN_URL = "http://localhost:3000"
const SESSIONS = "/sessions"
const USERS = "/users"
const CARDS = "/cards"
const SESSIONCARDS = "/session_cards"
const ANSWERS = "/answers"
const cardContainer = document.querySelector('#card-container')
const statsContainer = document.querySelector('#stats-container')
const aboutContainer = document.querySelector('#about-container')

Chart.defaults.global.defaultFontColor = 'white'
const quizPage = document.querySelector('.quiz-page')
const login = document.querySelector('#login')
const selections = document.querySelector('#selections')
const mainPage = document.querySelector("#main-page")
const cardsArray = []
let current_user_answers = []
let govPercent = 0
let hisPercent = 0
let geoPercent = 0
let current_user_id = 0
let session_id = null
let currentCards = []
let card_index = 0
let ten_questions = false
let twenty_questions = false
let government = false
let history = false
let geography = false
let toggleStats = true
let toggleAbout = true
// let test = false

//initial load of all cards into cardsArray
function loadCards() {
  fetch(`${MAIN_URL}${CARDS}`)
  .then(resp => resp.json())
  .then(json => json.forEach(card => cardsArray.push(card)))
}

//initial call to add eventlisteners to page & loadcards
addEventListenersToPage()
loadCards()
lockScroll()

function collapseNav(){
  const bar = document.getElementById("myTopNav");
    if (bar.className === "topnav") {
      bar.className += " responsive";
    } else {
      bar.className = "topnav";
    }
    console.log(bar.className)
}

//initial call to temporarily lock scroll on login page
function lockScroll(){
  document.getElementsByTagName('body')[0].classList.add('noscroll')
}

function removeLockScroll(){
  document.getElementsByTagName('body')[0].classList.remove('noscroll')
}

//function to retrieve cards for the session
function getCards(json) {
  fetch(`${MAIN_URL}${SESSIONS}/${json.id}`)
  .then(resp => resp.json())
  .then(json => {
    session_id = json.id
    currentCards = shuffleArray(json.cards)
    if (ten_questions){
      currentCards = currentCards.slice(0,10)
    }
    if (twenty_questions){
      currentCards = currentCards.slice(0,20)
    }
    if (government){
      currentCards = currentCards.filter(card => card.category === 'Government')
    }
    if (history){
      currentCards = currentCards.filter(card => card.category === 'History')
    }
    if (geography){
      currentCards = currentCards.filter(card => card.category === 'Geography')
    }
    // if (test){
    //   currentCards = [currentCards.find(card => card.id === 1)]
    // }
    renderCard(currentCards, json.id, card_index)
    slapStatsOnTheDom(json)
  })
}

//function to render the quiz selection on quiz page
function renderSelection() {
  cardContainer.innerHTML = `

  <h4 id = "select-title-top" class="font">Select Number of Questions:</h4>
    <button id="10-questions" class="selections">10 Questions</button>
    <button id="20-questions" class="selections">20 Questions</button>
    <button id="all-questions" class="selections">All Questions</button>
  <h4 class="font">Select Questions by Category:</h4>
    <button id="government" class="selections">Government</button>
    <button id="history" class="selections">History</button>
    <button id="geography" class="selections">Geography</button>
  </div>
  <!-- <button id="test" class="selections">Test</button> -->
  `
}

//function to render cards on DOM
function renderCard(cards, session_id, card_index) {
  const card = cards[card_index]
  cardContainer.innerHTML = `
  <div data-card-id="${card.id}" class="card">
    <div class = "flip-card-front">
     <img class = "card-images" src= "${card.image_url}">
      <h2 class="font">${card.question}</h2>
      <form class = "answers-form" id="question-form" action="/sessions/${session_id}" method="patch">
        ${randomizeAnswers(card)}
        <input type="submit" value="Submit" data-session-id=${session_id} id="submit-btn" class="font">
      </form>
      <p class="font" style="font-size: 13px; margin: -10px;">${card_index + 1} out of ${cards.length}</p>
    </div>
    <div class = "flip-card-back">
      <h4 id="answer-title">Answer: ${card.answer}</h4>
      <p>
        ${card.description}
      </p>
      <button id="next">Next</button>
    </div>
  </div>
  `
  if (card_index === currentCards.length -1){
    const next_button = cardContainer.querySelector("#next")
    next_button.innerText = "Finish"
  }

  document.getElementById("question-form").onkeypress = function(e) {
    const key = e.charCode || e.keyCode || 0
    if (key == 13) {
      e.preventDefault()
    }
  }
}

//load next question function
function loadNextQuestion(event){
  card_index ++
  renderCard(currentCards, session_id, card_index)
}

//function to randomize the order of answers
function randomizeAnswers(card) {
  const answer = card.answer
  const choices = card.choices.map(choice => choice.option)

  const answersArray = choices.map(choice => {
    let i = 1
    const input = `
    <div class="radio-btn">
      <input type="radio" value="${choice}" id="radio-${i}" name="selection" class="form-radio"><label for="radio-${i}" class="font radio-size">${choice}</label>
    </div>
    `
    i++
    return input
  })

  const answerInput = `
  <div class="radio-btn">
    <input type="radio" class="answer form-radio" value="${answer}" name="selection" id="radio-answer"><label for="radio-answer" class="font radio-size">${answer}</label>
  </div>
  `
  answersArray.push(answerInput)

  return shuffleArray(answersArray).join('')
}

//callback function to randomizeAnswers
function shuffleArray(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
   }
   return array
}

//function to render stats on DOM
function slapStatsOnTheDom(session) {
  statsContainer.innerHTML = `
    <div class="right-wrong">
    <h4 id="right" class="font">Right: ${session.right}</h4>
    <h4 id="wrong" class="font">Wrong: ${session.wrong}</h4>
    </div>
    <p id="total" hidden>${session.right+session.wrong}</p>
    <canvas id="my-chart" width="500" height="750"></canvas>
  `
  let card = document.querySelector('.flip-card-back')
}


//all eventlisteners for page
function addEventListenersToPage() {
  //right or wrong
  cardContainer.addEventListener('submit', e => {
    e.preventDefault()
    let answer = false
    if (document.querySelector('input[name="selection"]:checked').classList.contains('answer')) {
      answer = true
      let current_right_stats = statsContainer.querySelector('#right').innerText.split(' ')[1]
      current_right_stats++
      const configPatch = {
        method: "PATCH",
        headers: {
          "Content-Type": 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          "right": current_right_stats,
          "card_id": currentCards[card_index].id
        })
      }

      fetch(`${MAIN_URL}${SESSIONS}/${cardContainer.querySelector('input[type="submit"]').dataset.sessionId}`, configPatch)
      .then(resp => resp.json())
      .then(json => {
        updateStats(json, answer)
        // showDescription(e.target.parentNode.parentNode)
        flipCard(e)
      })
    } else {
      let current_wrong_stats = statsContainer.querySelector('#wrong').innerText.split(' ')[1]
      current_wrong_stats++
      const configPatch = {
        method: "PATCH",
        headers: {
          "Content-Type": 'application/json',
          Accept: 'application/json'
        },
        body: JSON.stringify({
          "wrong": current_wrong_stats,
          "card_id": currentCards[card_index].id
        })
      }

      fetch(`${MAIN_URL}${SESSIONS}/${cardContainer.querySelector('input[type="submit"]').dataset.sessionId}`, configPatch)
      .then(resp => resp.json())
      .then(json => {
        updateStats(json)
        flipCard(e)
        // showDescription(e.target.parentNode.parentNode)
      })
    }
  })

  //login
  login.addEventListener('submit', e => {
    e.preventDefault()
    const user_input = login.querySelector('input[type="text"]').value
    const name_input = login_form.querySelector('#name-input')

    fetch(`${MAIN_URL}${USERS}`)
    .then(resp => resp.json())
    .then(json => findOrCreateUser(json, user_input))
    .then(removeLockScroll())
    .then(scrollDown())
    .then(lockScroll())
    .then(renderSelection())

    name_input.reset()
  })

  //next button
  document.addEventListener('click', e => {
    if (e.target.id === "next" && e.target.innerText !== "Finish"){
      loadNextQuestion(e)
    }
    if (e.target.innerText === "Finish"){
      const right_stats = statsContainer.querySelector('#right')
      const wrong_stats = statsContainer.querySelector('#wrong')
      const total_stats = statsContainer.querySelector('#total')
      cardContainer.innerHTML =  `
        <div class="results font">
          <h2>Good Job!</h2>
          <h3>${parseInt((right_stats.innerText.split(" ")[1]/ total_stats.innerText)*100)}%</h3>
          <br>
          <p>You got ${right_stats.innerText.split(" ")[1]} questions right out of ${total_stats.innerText}</p>
          <button id="restart">Restart</button>
        </div>
      `
    }
    if (e.target.innerText === "Learn More"){
      removeLockScroll();
      document.querySelector("#en").style.display = 'flex';
      document.querySelector("#es").style.display = 'flex';
      document.querySelector("#ch").style.display = 'flex';
      scrollDown_info();
    }
    if (e.target.innerText === "ES"){
      window.location = 'index.html#Spanish-section'
    }
    if (e.target.innerText === "EN"){
      window.location = 'index.html#English-section'
    }
    if (e.target.innerText === "CH"){
      window.location = 'index.html#Chinese-section'

    }
  })



  //selection of quiz
  quizPage.addEventListener('click', e => {
   if (e.target.id === 'all-questions') {
     createSessionForUser(current_user_id)
   }
   if (e.target.id === '10-questions'){
     ten_questions = true
     createSessionForUser(current_user_id)
   }
   if (e.target.id === '20-questions'){
     twenty_questions = true
     createSessionForUser(current_user_id)
   }
   if (e.target.id === 'government'){
     government = true
     createSessionForUser(current_user_id)
   }
   if (e.target.id === 'history'){
     history = true
     createSessionForUser(current_user_id)
   }
   if (e.target.id === 'geography'){
     geography = true
     createSessionForUser(current_user_id)
   }
   // if (e.target.id === 'test'){
   //   test = true
   //   createSessionForUser(current_user_id)
   // }
   if (e.target.id === 'restart') {
     card_index = 0
     session_id = null
     currentCards = []
     ten_questions = false
     twenty_questions = false
     government = false
     history = false
     geography = false
     i = 1
     current_user_answers = []
     statsContainer.innerHTML = `
     <canvas id="my-chart" width="500" height="750"></canvas>
     `
     getStats(current_user_id)
     renderSelection()
   }
 })


 //nav-bar functionality
 const nav_bar = document.querySelector('#navbar')

 nav_bar.addEventListener('click', e => {
   e.preventDefault()
   if (e.target.innerText === 'STATS') {
     if (toggleStats) {
       openStats()
       toggleStats = false
     } else {
       closeStats()
       toggleStats = true
     }
   } else if (e.target.innerText === 'ABOUT') {
     if (toggleAbout) {
       openAbout()
       toggleAbout = false
     } else {
       closeAbout()
       toggleAbout = true
     }
   } else if (e.target.innerText === 'Logout') {
     const nav_bar = document.querySelector('#navbar')
     window.scrollBy(0, -1000)
     nav_bar.hidden = true
     statsContainer.hidden = true
     card_index = 0
     session_id = null
     currentCards = []
     ten_questions = false
     twenty_questions = false
     government = false
     history = false
     geography = false
     govPercent = 0
     hisPercent = 0
     geoPercent = 0
     current_user_answers = []
   }
 })
}

function getStats(user_id) {
  fetch(`${MAIN_URL}${USERS}/${user_id}`)
  .then(resp => resp.json())
  .then(json => categoryStats(json.answers))
}

function categoryStats(answers) {
  const govArray = answers.filter(answer => answer.card.category === 'Government')
  const hisArray = answers.filter(answer => answer.card.category === 'History')
  const geoArray = answers.filter(answer => answer.card.category === 'Geography')

  const govCorrect = govArray.filter(answer => answer.correct === true).length
  const hisCorrect = hisArray.filter(answer => answer.correct === true).length
  const geoCorrect = geoArray.filter(answer => answer.correct === true).length

  govPercent = parseInt((govCorrect/govArray.length) * 100)
  hisPercent = parseInt((hisCorrect/hisArray.length) * 100)
  geoPercent = parseInt((geoCorrect/geoArray.length) * 100)

  addCategoryStats()
}

function addCategoryStats() {
  const chart = statsContainer.querySelector('#my-chart')

  const categoryBarChart = new Chart(chart, {
  type: 'bar',
  data: {
    labels: ['History', 'Government', 'Geography'],
    datasets: [{
      label: '% Answered Correct',
      data: [hisPercent, govPercent, geoPercent],
      backgroundColor: [
        'rgba(255, 99, 132, 0.5)',
        'rgba(255, 255, 255, 0.5)',
        'rgba(54, 162, 235, 0.5)'
      ],
      borderColor: [
        'rgba(255, 99, 132, 1)',
        'rgba(255, 255, 255, 1)',
        'rgba(54, 162, 235, 1)'
      ],
      borderWidth: 1
    }]
  },
  options: {
      scales: {
          yAxes: [{
            id: 'A',
              ticks: {
                min: 0,
                max: 100,
                stepSize: 20
              }
          }]
      }
    },
    plugins: {
      annotation: {
        annotations: [{
          type: 'line',
          mode: 'horizontal',
          scaleID: 'A',
          value: 60,
          borderColor: 'red',
          borderWidth: 5,
          label: {
            enabled: false,
            content: 'Passing Mark'
          }
        }]
      }
    }
  })
}

function openStats() {
  document.querySelector('#stats-container').style.width = '320px'
  document.querySelector('#main-page').style.marginLeft = '320px'
}

function closeStats() {
  document.querySelector('#stats-container').style.width = '0'
  document.querySelector('#main-page').style.marginLeft = '0'
}

function openAbout() {
  document.querySelector('#about-container').style.width = '320px'
  document.querySelector('#main-page').style.marginRight = '320px'
}

function closeAbout() {
  document.querySelector('#about-container').style.width = '0'
  document.querySelector('#main-page').style.marginRight = '0'
}

//function to scroll down page automatically upon login
function scrollDown(){
  const nav_bar = document.querySelector('#navbar')
  window.scrollBy(0, 1000)
  setTimeout(function(){ nav_bar.hidden = false }, 500)
}

function scrollDown_info(){
  const nav_bar = document.querySelector('#navbar')
  window.scrollBy(0, 700)
  setTimeout(function(){ nav_bar.hidden = false }, 500)
}

//function to flip quiz card
function flipCard(e){
  let el = e.target.parentElement.parentElement
  el.style["transform"] = "rotateY(180deg)";
}

//function to update stats during quiz
function updateStats(session, answer) {
    const right_stats = statsContainer.querySelector('#right')
    const wrong_stats = statsContainer.querySelector('#wrong')
    const total_stats = statsContainer.querySelector('#total')
    const ctx = statsContainer.querySelector('#my-chart')
    right_stats.innerText = `Right: ${session.right}`
    wrong_stats.innerText = `Wrong: ${session.wrong}`
    total_stats.innerText = `${session.right + session.wrong}`

    let card = document.querySelector(".flip-card-back")
    if (answer){
      card.children[0].innerText += "  ✔"
      card.querySelector("h4").style.color = "#0f7d0f"
    } else {
      card.children[0].innerText += "  X"
      card.querySelector("h4").style.color = "#ec1e1e"

    }
    const myBarChart = new Chart(ctx, {
    type: 'bar',
    data: {
      labels: ['Right', 'Wrong'],
      datasets: [{
        label: 'Questions Answered',
        data: [session.right, session.wrong],
        backgroundColor: [
          'rgba(123, 239, 178, 0.5)',
          'rgba(255, 99, 132, 0.5)'
        ],
        borderColor: [
          'rgba(123, 239, 178, 1)',
          'rgba(255, 99, 132, 1)'
        ],
        borderWidth: 1
      }]
    },
    options: {
        scales: {
            yAxes: [{
                ticks: {
                  min: 0,
                  max: 30,
                  stepSize: 1
                }
            }]
        }
    }
  })
}

//function to find or create user upon login
function findOrCreateUser(users, user_input) {
  const result = users.find(user => {
    return user.name === user_input
  })
  if (result) {
    current_user_id = result.id
    getStats(result.id)
    // createSessionForUser(user_id)
  } else {
    const configPost = {
      method: "POST",
      headers: {
        "Content-Type": 'application/json',
        Accept: 'application/json'
      },
      body: JSON.stringify({
        "name": user_input
      })
    }
    fetch(`${MAIN_URL}${USERS}`, configPost)
    .then(resp => resp.json())
    .then(json => {
      current_user_id = json.id
      getStats(json.id)
    })
  }
}

//function to create new session
function createSessionForUser(user_id) {
  const configPost = {
    method: "POST",
    headers: {
      "Content-Type": 'application/json',
      Accept: 'application/json'
    },
    body: JSON.stringify({
      "user_id": user_id,
      "right": 0,
      "wrong": 0
    })
  }
  fetch(`${MAIN_URL}${SESSIONS}`, configPost)
  .then(resp => resp.json())
  .then(json => getCards(json))
}
