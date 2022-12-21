/* author: gabe farrell */

import tiles from "./tiles.js";

// set up initial game state
let board = ['', '', '', '', '', '', '', '']
let scores = [0, 0, 0, 0, 0, 0, 0, 0]
let letters =  ["a", "b", "c", "d", "e", "f", "g", "h", "i", "j", "k", "l", "m", "n", "o", "p", "q", "r", "s", "t", "u", "v", "w", "x", "y", "z"]
let highScore = 0
let score = 0
let tilesLeft = 98

// create the initial hand of tiles
generateAllTiles()

// make all the initial tiles draggable
$('.tile').draggable({
    containment: '#container',
    cursor: 'grabbing',
    opacity: 0.75,
    revert: 'invalid',
    scroll: false,
})

// initiate the drop area
$('.drop').droppable({
    accept: '.tile',
    drop: function(event, ui) {
        let tile
        // on drop, animate the tile moving to the center of the drop area
        ui.draggable.position({
          my: "center",
          at: "center",
          of: $(this),
          using: function(pos) {
            $(this).animate(pos, 50, "linear");
            // also while we move the tile, we can determine which letter it
            // was, and disable its dragging
            tile = $(this).attr('class').split(/\s+/)[1] // extracts tile letter from classes
            $(this).addClass('onboard')
            $(this).draggable('disable')
          }
        });
        // make the spot the tile rests on undroppable
        $(this).droppable('disable')
        // place the tile in memory after waiting for animation to fix position
        // the position is determined by finding the distance between the tile's offset and
        // the offset of the container (unchanging)
        setTimeout(place(tile, posToTile(ui.draggable.offset().left - $('#container').offset().left)), 100)
    },
})

// returns the current score of the word being made
function getScore() {
    let total = 0
    for (let i = 0; i < 8; i++) {
        total += scores[i]
    }
    if (scores[5] != 0) { // double word score space is not empty
        total *= 2;
    }
    return total
}

// sets all system values to reflect a tile being placed in position pos
function place(letter, pos) {
    let tileval = tiles[letter].value // get tile value from letter
    if (pos == 2)  {// double letter spot
        tileval *= 2
    }
    // set the tile into system memory
    scores[pos] = tileval
    board[pos] = letter
    // display the current state of the word
    printWord()
    // if there are less than 2 letters down, we dont consider it a word
    if (getWord().length < 2) {
        return
    }
    // use the open dictionaryapi to determine if a given word is real
    fetch('https://api.dictionaryapi.dev/api/v2/entries/en/' + getWord())
    .then((resp) => {
        if (resp.status !== 200) {
            // if not real, add error class
            $('#word').addClass('error')
        } else {
            // if real, remove error class
            $('#word').removeClass('error')
        }
    })
}

// determines the spot the tile was placed based on position
function posToTile(pos) {
    pos = pos - 200
    console.log(Math.floor(pos / 85))
    return Math.floor(pos / 85)
}

// prints the current status of the word being built to the screen
function printWord() {
    let w = getWord()
    $('#word').text(w + ' ('+getScore()+')')
}

// returns a string with the current status of the word
function getWord() {
    let word = ''
    for (let l of board) {
        if (l == '') {
            word += ' '
        } else {
            word += l
        }
    }
    word = word.trim().replaceAll(/\s/g, '-') // format the word for display
    return word
}

// generates an entirely new hand of tiles
function generateAllTiles() {
    // create the random tiles
    for (let i = 0; i < 7; i++) {
        $('.tile')[i].className='tile ' + randomLetter()
    }
    // reset dragging for all tiles
    $('.tile').draggable({
        containment: '#container',
        cursor: 'grabbing',
        opacity: 0.75,
        revert: 'invalid',
        scroll: false,
    })
    // enable draggable for all tiles, in case some were on the board
    // (and therefore had dragging disabled)
    $('.tile').draggable('enable')
}

// generates new tiles only to replace those which are not in the hand
function generateMissingTiles() {
    // make sure there are tiles left
    if (tilesLeft < 1) {
        alert('No tiles left! GG!')
    }
    // for every spot in the hand...
    for (let i = 0; i < 7; i++) {
        if (board[i] != '') { // if the tile is placed on the board...
            // replace the tile...
            $('.tile.' + board[i])[0].className = 'tile ' + randomLetter()
            // ...remove it from the pool...
            tiles[board[i]].left--
            tilesLeft--
            // and the board
            board[i] = ''
        }
    }
    // make sure all the tiles are draggable
    $('.tile').draggable({
        containment: '#container',
        cursor: 'grabbing',
        opacity: 0.75,
        revert: 'invalid',
        scroll: false,
    })
    $('.tile').draggable('enable')
    // send all tiles back to the hand
    clearTiles()
}

// returns a random letter of a tile remaining in the pool
function randomLetter() {
    let num = Math.floor(Math.random() * tilesLeft)
    let curr = 0
    for (let t in tiles) {
        curr += tiles[t].left
        if (num <= curr) {
            return t
        }
    }
}

// resets the tile pool
function resetTileAmounts() {
    for (let t of tiles) {
        t.left = t.amount
    }
}

// ---------- button functions

// clears all tiles off the board and brings them back to the hand
$('#clear').click(clearTiles)
function clearTiles() {
    board = ['', '', '', '', '', '', '', '']
    scores = [0, 0, 0, 0, 0, 0, 0, 0]
    $(".tile").animate({
        top: "0px",
        left: "0px"
    });
    $('#word').text('---')
    $('.drop').droppable('enable')
    $('#word').removeClass('error')
    $('.tile').draggable('enable')
    $('.tile').removeClass('onboard')
}

// submits the word
$('#submit').click(() => {
    // if the dictionary determines it is not real, return
    if ($('#word').hasClass('error')) {
        return
    }
    // see of this word has a higher score than the current best word
    let s = getScore()
    if (s > highScore) {
        // if so, make this word the best one
        highScore = s
        $('#topscore').text('Best Word: ' + getWord() + ' ('+highScore+')')
    }
    // increment score
    score += s
    $('#score').text('Score: ' + score)
    // replace missing tiles
    generateMissingTiles()
})

// resets the whole game, including scores and tiles
$('#reset').click(() => {
    clearTiles()
    generateAllTiles()
    resetTileAmounts()
    highScore = 0
    score = 0
    tilesLeft = 98
    $('#score').text('Score: 0')
    $('#topscore').text('Best Word: --- (0)')
    $('#word').removeClass('error')
})