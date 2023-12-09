require("dotenv").config({ path: "./assets/server/modules/.env" });
const TelegramBot = require("node-telegram-bot-api");
const bot = new TelegramBot("6960004050:AAG8sukhWpyK0X4qu_i9EcMRkvMWrFUORio", {
  polling: true,
});
const db = require("./assets/db/db.json");
const {
  adminStartKeyboard,
  userStartKeyboard,
  arenaKeyboard,
  adminOptionsKeyboard,
  shopKeyboard,
} = require("./assets/keyboard/keyboard");
const {
  sendProfileData,
  changeName,
  myCards,
} = require("./assets/scripts/userFunctions/userFunctions");
const {
  setAdmin,
  giveCardToUser,
  findUser,
  createPromo,
  showAllUsers,
  askCardDetails,
} = require("./assets/scripts/adminFunctions/adminFunctions");
const {
  addToWaitingRoom,
  matchInventory,
  processCallback,
  checkAndCreateMatch,
} = require("./assets/scripts/matchFunctions/matchFunctions");
const { getPack } = require("./assets/scripts/shopFunctions/shopFunctions");
const { giveRandomCardToUser } = require("./assets/scripts/getCard/getCard");
const { top } = require("./assets/scripts/top/top");

const commands = JSON.parse(
  require("fs").readFileSync("./assets/db/commands/commands.json")
);

bot.setMyCommands(commands);

bot.on("message", async (msg) => {
    const channelUsername = "MCLPodPivomTournament";
    const username = msg.from.username;
  
    // Check if the user is subscribed to the channel
    const isSubscribed = await bot.getChatMember(channelUsername, msg.from.id)
      .then((chatMember) => chatMember.status === "member")
      .catch(() => false);
  
    if (!isSubscribed) {
      // If not subscribed, prompt the user to subscribe and provide a link
      await bot.sendMessage(msg.chat.id, `Пожалуйста, подпишитесь на канал ${channelUsername}: t.me/${channelUsername}`);
      return; // Stop further processing if the user is not subscribed
    }
  
    let user = db.find((user) => user.username === msg.from.username);
  
    if (msg.text === "/start") {
      if (!user) {
        db.push({
          username: msg.from.username,
          first_name: msg.from.first_name,
          last_name: msg.from.last_name,
          id: msg.chat.id,
          balance: 0,
          rating: null,
          inventory: [],
          matchInventory: [],
          isAdmin: false,
          isWaiting: false,
          isMatch: false,
          wonMatches: 0,
          looseMatches: 0,
        });
        require("fs").writeFileSync(
          "./assets/db/db.json",
          JSON.stringify(db, null, "\t")
        );
        await bot.sendMessage(
          msg.chat.id,
          `Привет ${msg.from.username}`,
          userStartKeyboard
        );
      } else {
        const isAdminMessage = user.isAdmin ? "Вы админ!" : "";
        await bot.sendMessage(
          msg.chat.id,
          `Привет ${msg.from.username}. ${isAdminMessage}`,
          user.isAdmin ? adminStartKeyboard : userStartKeyboard
        );
      }
    } else if (msg.text === "/profile" || msg.text == "👤 Личный Профиль") {
      sendProfileData(bot, msg);
    } else if (msg.text === "/arenas" || msg.text == "⚔️ Арены") {
      await bot.sendMessage(msg.chat.id, "Список Арен", arenaKeyboard);
    } else if (msg.text === "/shop" || msg.text == "🛒 Магазин паков") {
      await bot.sendMessage(msg.chat.id, "вот паки на выбор", shopKeyboard);
    } else if (msg.text === "/getcard" || msg.text == "🀄️ Получить карточку") {
      giveRandomCardToUser(bot, msg);
    } else if (msg.text === "⚙️ Админ Панель" && user.isAdmin) {
      await bot.sendMessage(
        msg.chat.id,
        "вот что ты можешь сделать",
        adminOptionsKeyboard
      );
    } else if (
      msg.text === "🀄️ Добавить карту в инвентарь матчей" ||
      "/addcardtomatch"
    ) {
      matchInventory(bot, msg);
    } else if (msg.text === "/top") {
      top(bot, msg);
    } else {
      await bot.sendMessage(msg.chat.id, "Выберите существующую команду");
    }
  });
  
bot.on("callback_query", async (msg) => {
    try {
      console.log("callback_query:", msg);
  
      if (msg.data.startsWith("createPromo_")) {
        await addToMatchInventory(bot, msg);
      } else if (msg.data === "cardAmount") {
        askCardDetails(bot, msg);
      } else if (msg.data === "createPromo") {
        createPromo(bot, msg);
      } else if (msg.data === "showAllUsers") {
        showAllUsers(bot, msg);
      } else if (msg.data === "findUser") {
        await bot.sendMessage(
          msg.message.chat.id,
          "Пришлите мне username пользователя"
        );
        await findUser(bot, msg);
      } else if (msg.data === "addCardToUser") {
        await giveCardToUser(bot, msg);
      } else if (msg.data === "setAdmin") {
        await bot.sendMessage(
          msg.message.chat.id,
          "Пришлите мне имя пользователя"
        );
        bot.once("message", (msg) => setAdmin(bot, msg));
      } else if (msg.data === "usualmatch") {
        await addToWaitingRoom(bot, msg);
      } else if (msg.data === "getonepack") {
        getPack(bot, msg, 1);
      } else if (msg.data === "getfivepacks") {
        getPack(bot, msg, 5);
      } else if (msg.data === "gettenpacks") {
        getPack(bot, msg, 10);
      } else if (msg.data === "rating") {
        processCallback(bot, msg);
      } else if (msg.data === "usual") {
        checkAndCreateMatch(bot, msg);
      } else if (msg.data === "changename") {
        changeName(bot, msg);
      } else if (msg.data === "mycards") {
        myCards(bot, msg);
      } else if (msg.data === "closewindow") {
        await bot.sendMessage(
          msg.chat.id,
          "Привет админ вот что ты можешь сделать",
          adminStartKeyboard
        );
      } else {
        await bot.sendMessage(msg.message.chat.id, "Таких данных не существует");
      }
    } catch (error) {
      console.error("Произошла ошибка при обработке колбэк-запроса:", error);
    }
  });

bot.on("polling_error", console.log);
