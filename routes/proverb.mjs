export default class Proverb {
    get (args, msg) {
        msg.channel.send(`\`${PROVERBS[rng(0, PROVERBS.length)]}\``)
    }
}