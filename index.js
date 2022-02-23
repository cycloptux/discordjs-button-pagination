const {
  ActionRow,
  Message,
  Embed,
  ButtonComponent,
  ButtonStyle
} = require("discord.js");

/**
 * Creates a pagination embed
 * @param {Message} msg
 * @param {Embed[]} pages
 * @param {ButtonComponent[]} buttonList
 * @param {number} timeout
 * @returns
 */
const paginationEmbed = async (msg, pages, buttonList, timeout = 120_000) => {
  if (!msg && !msg.channel) throw new Error("Channel is inaccessible.");
  if (!pages) throw new Error("Pages are not given.");
  if (!buttonList) throw new Error("Buttons are not given.");
  if (buttonList[0].style === ButtonStyle.Link || buttonList[1].style === ButtonStyle.Link)
    throw new Error(
      "Link buttons are not supported with discordjs-button-pagination"
    );
  if (buttonList.length !== 2) throw new Error("Need two buttons.");

  let page = 0;

  const row = new ActionRow();
  buttonList.forEach((button) => { row.addComponents(button); });
  const curPage = await msg.channel.send({
    embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
    components: [row],
  });

  const filter = (i) =>
    i.customId === buttonList[0].customId ||
    i.customId === buttonList[1].customId;

  const collector = await curPage.createMessageComponentCollector({
    filter,
    time: timeout,
  });

  collector.on("collect", async (i) => {
    switch (i.customId) {
      case buttonList[0].customId:
        page = page > 0 ? --page : pages.length - 1;
        break;
      case buttonList[1].customId:
        page = page + 1 < pages.length ? ++page : 0;
        break;
      default:
        break;
    }
    await i.deferUpdate();
    await i.editReply({
      embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
      components: [row],
    });
    collector.resetTimer();
  });

  collector.on("end", (_, reason) => {
    if (reason !== "messageDelete") {
      const disabledRow = new ActionRow();
      buttonList.forEach((button) => {
        disabledRow.addComponents(button.setDisabled(true));
      });
      curPage.edit({
        embeds: [pages[page].setFooter({ text: `Page ${page + 1} / ${pages.length}` })],
        components: [disabledRow],
      });
    }
  });

  return curPage;
};
module.exports = paginationEmbed;
