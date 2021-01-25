import ci from './citation.mjs'
import fe from './feed.mjs'
import fi from './filter.mjs'
import ma from './markov.mjs'
import pr from './proverb.mjs'

export default { 
    citation : new ci(),
    feed : new fe(),
    filter : new fi(),
    markov : new ma(),
    proverb : new pr()
}