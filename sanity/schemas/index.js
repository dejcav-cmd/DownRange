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
import { outreachContact }  from './outreachContact'
import { dailyBriefing }    from './dailyBriefing'
import { canadaContent }    from './canadaContent'
import { competition }      from './competition'
import { outreachCampaign } from './outreachCampaign'
import { outreachTemplate } from './outreachTemplate'
import { outreachSendLog }  from './outreachSendLog'
import { cronRunStore }     from './cronRunStore'
import { blogPost }         from './blogPost'

export const schemaTypes = [
  newsArticle,
  imageAsset, breakingAlert, legislation, review,
  firearmRelease, stateProfile, ammoPrice, video, author, globalStats,
  priceAlert, billTracker, siteConfig, marketAnalysis,
  outreachContact, outreachCampaign, outreachTemplate, outreachSendLog,
  dailyBriefing,
  canadaContent,
  competition,
  cronRunStore,
  blogPost,
]
