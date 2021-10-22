Hooks.on("ready", async () => {
    //RUNS ON LOAD
    spawnHand();
    loadCardToolTip();
    if (!game.user.isGM) return;
    if (game.folders.find(f => f.name == "Character Decks") == null) {
        await Folder.create({ name: `Character Decks`, type: "Cards" })
    }
    if (game.folders.find(f => f.name == "WildCard") == null) {
        await Folder.create({ name: `WildCard`, type: "Cards" })
    }
    for (let character of game.actors.filter(a => a.type == "character")) {
        const characterName = character.data.name
        if (!game.cards.find(c => c.name == characterName)) {
            await Cards.create({ name: characterName, type: "hand", folder: game.folders.find(f => f.name == "Character Decks").id })
        }
    }

    if (!game.cards.find(c => c.name == "On Board")) {
        await Cards.create({ name: "On Board", type: "pile", folder: game.folders.find(f => f.name == "WildCard").id })
    }
    Hooks.on('renderCardsHand', (sheet, html) => {
        loadCardToolTip();
    });
    Hooks.on('renderCardsPile', (sheet, html) => {
        loadCardToolTip();
    });
    Hooks.on('renderCardsDeck', (sheet, html) => {
        loadCardToolTip();
    });

    function loadCardToolTip() {
        console.log("Loading Card Tooltip");
        if (document.getElementById("cardTooltip") != null) {
            document.getElementById("cardTooltip").remove();
        }
        let div = document.createElement("div");
        div.id = "cardTooltip";
        div.innerHTML = '<img id="cardTooltipImage" class="cardTooltip hidden" alt="Seven of Diamonds" height="48" src="" style="border: unset;transform: scale(5);position: absolute;transition: top 0.1s linear 0s, left 0.1s linear 0s;">';
        //document.getElementById("hud").append(div);
        document.getElementsByClassName("vtt")[0].append(div);
        spawnHand();
    }
})

Hooks.on('renderPlayerList', () => {
    //console.log("RenderPlayerList detected");
    for (let i = 0; i < game.users._source.length; i++) {
        if (game.users._source[i].character != null) {
            //console.log("found character for " + game.users._source[i].name);
            if (game.cards.getName(game.actors.get(game.users._source[i].character).name) != null) {
                //console.log("found deck for " + game.users._source[i].name);
                let amount = game.cards.getName(game.actors.get(game.users._source[i].character).name).cards.size;
                //console.log("Cards: " + amount)
                for (let p = 0; p < document.getElementsByClassName('player-name').length; p++) {
                    if (document.getElementsByClassName('player-name')[p].innerHTML.includes(game.users._source[i].name)) {
                        document.getElementsByClassName('player-name')[p].innerHTML += ' | <label><i class="fas fa-clone" title="' + game.users._source[i].name + " has " + amount + " cards" + '"></i> ' + amount + '</i></label>';
                    }
                }
            }
        }
    }
})
Hooks.on('renderCardsDirectory', () => {
    console.log("RenderSidebar detected");
    let cardsArray = document.getElementsByClassName('directory-item cards');
    for (let i = 0; i < cardsArray.length; i++) {
        let cardsName = document.getElementsByClassName('directory-item cards')[i].getElementsByClassName("document-name")[0];
        let cards = game.cards.getName(cardsName.firstChild.innerText);
        let amount = cards.cards.size;
        let label = document.createElement("label");
        label.innerHTML = ' | <i class="fas fa-clone" title="' + cardsName.firstChild.innerText + " has " + amount + " cards" + '"></i> ' + amount + '</i >'
        cardsName.append(label);
    }
})
Hooks.on('updateCard', () => {
    console.log("Card update detected");
    spawnHand();
})
Hooks.on('deleteCard', () => {
    console.log("Card update detected");
    spawnHand();
})
Hooks.on('renderApplication', (data) => {
    if (data.document == null) return;
    if (data.document.cards == null) return;
    console.log("Rendering application");
    if (data.document.cards != null) {
        if (data.document.cards.parent.name == "On Board") {
            document.querySelector('[value="On Board"]').disabled = true;
            document.querySelector('[data-action="shuffle"]').remove();
            document.querySelector('[data-action="pass"]').remove();
        }
    }
})
Hooks.on('renderTileHUD', (data) => {
    let cardData = data.object.data;
    console.log("Tile hud Render deteted");
    if (cardData.flags == null) return; //guard against tiles without flags
    if (cardData.flags.cardID == null) return; //if not a card

    document.querySelector('[data-action="overhead"]').remove();
    let takebutton = document.createElement('div');
    takebutton.id = "takeCardButton"
    takebutton.className = "control-icon";
    takebutton.styling = 'position: relative; top: 64 %; right: 200 %;pointer-events: all';
    takebutton.innerHTML = '<img src="icons/svg/wall-direction.svg" width="70" height="36" title="Take card">';
    takebutton.setAttribute('cardID', cardData.flags.cardID);
    takebutton.setAttribute('tileID', cardData._id);
    takebutton.addEventListener('click', function (event) {
        console.log("Take Card");
        this.getAttribute('cardID');
        if (game.cards.getName("On Board").cards.find(card => card.id == this.getAttribute('cardID')) == null) {
            ui.notifications.warn("This card doesn't exist on the board");
        }
        else {
            game.cards.getName("On Board").cards.find(card => card.id == this.getAttribute('cardID')).pass(game.cards.getName(game.user.character.name), this.getAttribute('cardID'));
            game.canvas.background.tiles.find(tile => tile.id == this.getAttribute('tileID')).release();
            let id = this.getAttribute('tileID');
            game.canvas.scene.deleteEmbeddedDocuments("Tile", [id]);
        }

        spawnHand();
    }, false);
    document.getElementById("tile-hud").getElementsByClassName("col middle")[0].append(takebutton);
})

CONFIG.debug.hooks = true;

function refreshInfo() {
    ui.sidebar.render(true);
    ui.players.render(true);
}

async function spawnHand() {
    refreshInfo();
    console.log("reloaded hand");
    if (document.getElementById("handBar") != null) {
        document.getElementById("handBar").remove();
    }
    let hand = document.createElement("div");
    hand.id = "handBar";
    hand.innerHTML = '<div id="cardHandBar" class="cardHandBar" style="display: block;pointer-events: all;border: 2px solid var(--color-border-dark);border-radius: 2px;background: rgba(0, 0, 0, 0.5);"></div>';
    //hand.innerHTML = '<div id="hotbar" class="flexrow"><div id="action-bar" class="flexcol cardHandBar"></div>';
    document.getElementById("ui-bottom").prepend(hand);

    $(".card.flexrow").hover(
        function (e) {// FUNCTION ON HOVER
            let tooltip = document.getElementById("cardTooltipImage");
            //console.log("Hovered over card");
            tooltip.src = this.getElementsByClassName("card-face")[0].src;
            var posX = this.getElementsByClassName("card-face")[0].getBoundingClientRect().x - 150 + this.getElementsByClassName("card-face")[0].width / 2;
            var posY = this.getElementsByClassName("card-face")[0].getBoundingClientRect().y + this.getElementsByClassName("card-face")[0].height / 2;
            document.getElementById("cardTooltipImage").classList.remove("hidden");
            document.getElementById("cardTooltipImage").style.top = "" + posY + "px";
            document.getElementById("cardTooltipImage").style.left = "" + posX + "px";
        }, function () {//FUNCTION ON HOVER EXIT
            let tooltip = document.getElementById("cardTooltipImage");
            document.getElementById("cardTooltipImage").classList.add("hidden");
        }
    );
    refreshHand();
}
async function refreshHand() {
    let i = 0;
    game.cards.find(c => c.data.name === game.user.character.name).cards.forEach(function (card, key, arr) {//LOAD CARDS
        let loadCard = document.createElement("a");
        loadCard.id = "handCard";
        loadCard.innerHTML = '<img id="cardOnHand" draggable="true" cardID="' + card.data._id + '" class="card-face cardTooltip cardOnHand" alt="Seven of Diamonds" height="48" src="' + card.data.document.img + '">';
        if (i == 0) {
            console.log("First card found");
            loadCard.innerHTML = '<img id="cardOnHand" draggable="true" cardID="' + card.data._id + '"  class="card-face cardTooltip cardOnHand firstcard" alt="Seven of Diamonds" height="48" src="' + card.data.document.img + '">';
        }
        else if (i === card.parent.cards._source.length - 1) {
            console.log("Last card found");
            loadCard.innerHTML = '<img id="cardOnHand" draggable="true" cardID="' + card.data._id + '" class="card-face cardTooltip cardOnHand lastcard" alt="Seven of Diamonds" height="48" src="' + card.data.document.img + '">';
        }
        loadCard.addEventListener("dragstart", _onDragStart, false);
        //document.getElementsByClassName("cardHandBar")[0].append(loadCard);
        document.getElementById("cardHandBar").append(loadCard);
        i++;
    });
    $(".cardOnHand").hover(
        function (e) {// FUNCTION ON HOVER
            let tooltip = document.getElementById("cardTooltipImage");
            console.log("Hovered over card");
            let url = document.createElement('a');
            url.href = this.src;
            tooltip.src = url.pathname;
            var posX = this.getBoundingClientRect().x + this.width / 2;
            var posY = this.getBoundingClientRect().y - 50 - this.height;
            console.log("posX: " + posX);
            console.log("posY: " + posY);
            document.getElementById("cardTooltipImage").classList.remove("hidden");
            document.getElementById("cardTooltipImage").style.top = "" + posY + "px";
            document.getElementById("cardTooltipImage").style.left = "" + posX + "px";
        }, function () {//FUNCTION ON HOVER EXIT
            let tooltip = document.getElementById("cardTooltipImage");
            document.getElementById("cardTooltipImage").classList.add("hidden");
        }
    );
}

function _onDragStart(event) {
    if (this.id != "handCard") return;
    event.stopPropagation();
    let url = this.children[0].src
        .replace(/"/g, "");
    let cardID = this.children[0].getAttribute("cardid");
    const dragData = { type: "image", src: url, cardID: cardID };
    event.dataTransfer.setData("text/plain", JSON.stringify(dragData));
}

// Create the tile with the gathered informations
async function _onDropImage(event, data) {
    if (data.type == "image") {
        let url = document.createElement('a');
        url.href = data.src;
        let tileData = {
            img: url.pathname
        };

        // Determine the tile size
        const tex = await loadTexture(data.src);
        tileData.width = game.canvas.grid.size * 2;
        tileData.height = game.canvas.grid.size * 3;

        // Project tile position
        let t = canvas.foreground.worldTransform;
        let flags = { "cardID": data.cardID, "playedBy": game.user.character };
        tileData.x = (event.clientX - t.tx) / canvas.stage.scale.x,
            tileData.y = (event.clientY - t.ty) / canvas.stage.scale.y,
            tileData.flags = flags;
        canvas.scene.createEmbeddedDocuments("Tile", [tileData]);
        console.log(tileData);
        //REMOVE CARD FROM HAND
        let discardpile = game.cards.getName("On Board");
        let cardArray = [data.cardID];
        await game.cards.getName(game.user.character.name).pass(discardpile, cardArray)
        spawnHand();
    }
}

// Add the listener to the board html element
Hooks.once("canvasReady", (_) => {
    document.getElementById("board").addEventListener("drop", (event) => {
        // Try to extract the data (type + src)
        let data;
        try {
            data = JSON.parse(event.dataTransfer.getData("text/plain"));
        } catch (err) {
            return;
        }
        // Create the tile
        _onDropImage(event, data);
    });
});