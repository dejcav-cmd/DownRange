import { siteConfig }    from './siteConfig'
import { marketAnalysis } from './marketAnalysis'
import newsArticle        from './newsArticle'
import { breakingAlert }  from './breakingAlert'
import { legislation }    from './legislation'
import { review }         from './review'
import { firearmRelease } from './firearmRelease'
import { stateProfile }   from './stateProfile'
import { ammoPrice }      from './ammoPrice'
import { video }          from './video'
import { author }         from './author'
import { globalStats }    from './globalStats'
import { priceAlert }     from './priceAlert'
import { billTracker }    from './billTracker'

export const schemaTypes = [
  newsArticle, breakingAlert, legislation, review,
  firearmRelease, stateProfile, ammoPrice, video, author, globalStats,
  priceAlert, billTracker, siteConfig, marketAnalysis,
]
