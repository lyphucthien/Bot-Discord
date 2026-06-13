module.exports = async (message) => {

    const badWords = ["địt", "cặc", "lồn", "fuck", "bitch"];
    const content = message.content.toLowerCase();

    if (badWords.some(w => content.includes(w))) {
        await message.delete().catch(() => { });
    }

};