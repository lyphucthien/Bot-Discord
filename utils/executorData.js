const { MessageFlags } = require('discord.js');

const EXECUTOR_DATA = {
    'Wave': { status: '🟢', download: 'https://getwave.gg/', discord: 'https://discord.gg/p4asyAEXt' },
    'Potassium': { status: '🟢', download: 'https://potassium.pro/', discord: 'https://discord.gg/potassium' },
    'Volt': { status: '🟢', download: 'https://voltbz.net/', discord: 'https://discord.gg/voltbz' },
    'Madium': { status: '🟢', download: 'https://getmadium.net/', discord: 'https://discord.gg/olemad' },
    'Real': { status: '🟢', download: 'https://projectreal.gg/', discord: 'https://discord.gg/projectreal' },
    'Velocity': { status: '🟢', download: 'https://getvelocity.llc/', discord: 'https://discord.gg/velocityide' },
    'Solara': { status: '🟢', download: 'https://getsolara.dev/', discord: 'https://stoat.chat/invite/yQBTsMHA' },
    'Xeno': { status: '🟢', download: 'https://xeno.now/', discord: 'https://discord.gg/xe-no' },
    'MacSploit': { status: '🟢', download: 'https://raptor.fun/', discord: 'https://discord.gg/macsploit' },
    'Opiumware': { status: '🟢', download: 'https://use.opiumware.today/', discord: 'https://discord.gg/opiumware' },
    'Delta (IOS & Android)': { status: '🟢', download: 'https://deltaexploits.gg/', discord: 'https://discord.gg/deltax' },
    'Vega X': { status: '🟢', download: 'https://vegax.gg/', discord: 'https://discord.gg/vegasupport' },
    'Codex': { status: '🟢', download: 'https://codex.lol/', discord: 'https://discord.gg/codexlol' }
};

function replyExecutorInfo(si, chosen) {
    const info = EXECUTOR_DATA[chosen];

    if (!info) {
        return si.reply({
            content: `**${chosen}**\n\n_(thông tin chi tiết sẽ cập nhật sau)_`,
            flags: MessageFlags.Ephemeral
        });
    }

    return si.reply({
        content:
            `# ${chosen} ${info.status}\n\n` +
            `**Download:** [Download](${info.download})\n` +
            `**Discord:** [Discord](${info.discord})`,
        flags: MessageFlags.Ephemeral
    });
}

module.exports = { EXECUTOR_DATA, replyExecutorInfo };