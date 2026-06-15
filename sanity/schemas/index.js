import { feedConfig } from './feedConfig'
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
import { brazilContent }     from './brazilContent'
import { competition }      from './competition'
import { outreachCampaign } from './outreachCampaign'
import { outreachTemplate } from './outreachTemplate'
import { outreachSendLog }  from './outreachSendLog'
import { cronRunStore }     from './cronRunStore'
import { blogPost }         from './blogPost'
import imageAsset           from './imageAsset'
import { nfaWaitTime }      from './nfaWaitTime'
import { cronRun }          from './cronRun'
import { youtubeInfluencer } from './youtubeInfluencer'
import { socialPost, socialConfig } from './socialPost'
import { gunDeal } from './gunDeal'
import newsletterSubscriber from './newsletterSubscriber'
import newsletterSchedule from './newsletterSchedule'

export const schemaTypes = [
  feedConfig,
  newsArticle,
  imageAsset, breakingAlert, legislation, review,
  firearmRelease, stateProfile, ammoPrice, video, author, globalStats,
  youtubeInfluencer,
  priceAlert, billTracker, siteConfig, marketAnalysis,
  outreachContact, outreachCampaign, outreachTemplate, outreachSendLog,
  dailyBriefing,
  canadaContent,
  brazilContent,
  competition,
  cronRunStore,
  blogPost,
  nfaWaitTime,
  cronRun,
  socialPost,
  socialConfig,
  gunDeal,
  newsletterSubscriber,
  newsletterSchedule,
]
