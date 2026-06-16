// app/components/EnhancedLawPanel.js
// Displays court cases, use cases, local restrictions, resources on state pages

'use client'

import { useState } from 'react'
import styles from '@/styles/enhanced-law-panel.module.css'

export default function EnhancedLawPanel({ data, stateName, stateCode }) {
  const [activeTab, setActiveTab] = useState('overview')
  
  if (!data) return null
  
  const {
    summary,
    coreLaws,
    localRestrictions,
    recentCaseLaw,
    useCases,
    reciprocityNotes,
    resources,
  } = data
  
  return (
    <div className={styles.container}>
      {/* Sticky Tab Navigation */}
      <div className={styles.tabBar}>
        <button
          className={`${styles.tab} ${activeTab === 'overview' ? styles.active : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          📋 Overview
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'cases' ? styles.active : ''}`}
          onClick={() => setActiveTab('cases')}
        >
          ⚖️ Court Cases
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'scenarios' ? styles.active : ''}`}
          onClick={() => setActiveTab('scenarios')}
        >
          🎯 Real Scenarios
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'local' ? styles.active : ''}`}
          onClick={() => setActiveTab('local')}
        >
          🏙️ Local Rules
        </button>
        <button
          className={`${styles.tab} ${activeTab === 'resources' ? styles.active : ''}`}
          onClick={() => setActiveTab('resources')}
        >
          📚 Resources
        </button>
      </div>
      
      {/* Content Panels */}
      {activeTab === 'overview' && (
        <div className={styles.panel}>
          <h3>Attorney's Analysis</h3>
          <div className={styles.summary}>
            {summary?.split('\n').map((para, i) => (
              <p key={i}>{para.trim()}</p>
            ))}
          </div>
          
          {reciprocityNotes && (
            <div className={styles.section}>
              <h4>🔄 Reciprocity & Travel</h4>
              <p className={styles.reciprocity}>{reciprocityNotes}</p>
            </div>
          )}
        </div>
      )}
      
      {activeTab === 'cases' && (
        <div className={styles.panel}>
          <h3>Landmark Court Decisions</h3>
          
          {recentCaseLaw?.cases && recentCaseLaw.cases.length > 0 ? (
            <div className={styles.caseList}>
              {recentCaseLaw.cases.map((caseTitle, i) => (
                <div key={i} className={styles.caseCard}>
                  <h4 className={styles.caseName}>{caseTitle}</h4>
                </div>
              ))}
              
              <div className={styles.caseImpact}>
                <h4>💡 What This Means for You</h4>
                <p>{recentCaseLaw.impact}</p>
              </div>
            </div>
          ) : (
            <p className={styles.noData}>No specific court cases affecting this state at this time.</p>
          )}
          
          <div className={styles.bruenNote}>
            <strong>Note:</strong> All state firearms laws must comply with the 2022 Supreme Court decision in 
            <em> New York State Rifle & Pistol v. Bruen</em>. Check for ongoing litigation affecting your state.
          </div>
        </div>
      )}
      
      {activeTab === 'scenarios' && (
        <div className={styles.panel}>
          <h3>Common Gun Owner Questions</h3>
          
          {useCases && useCases.length > 0 ? (
            <div className={styles.scenarioList}>
              {useCases.map((scenario, i) => (
                <div key={i} className={styles.scenarioCard}>
                  <span className={styles.scenarioNumber}>{i + 1}</span>
                  <p>{scenario}</p>
                </div>
              ))}
            </div>
          ) : (
            <p className={styles.noData}>Check NRA-ILA for detailed scenario guidance.</p>
          )}
          
          <p className={styles.disclaimer}>
            ⚠️ This is general information, not legal advice. Consult a firearms attorney for your specific situation.
          </p>
        </div>
      )}
      
      {activeTab === 'local' && (
        <div className={styles.panel}>
          <h3>Local & Municipal Restrictions</h3>
          
          {localRestrictions?.affected_areas ? (
            <div className={styles.localSection}>
              <p className={styles.warning}>
                🏙️ These cities/counties may have stricter rules than state law:
              </p>
              <ul className={styles.areaList}>
                {localRestrictions.affected_areas.map((area, i) => (
                  <li key={i}>
                    <strong>{area}</strong>
                    <span className={styles.note}>Check local ordinances before carrying or storing firearms</span>
                  </li>
                ))}
              </ul>
              <p className={styles.localNote}>{localRestrictions.note}</p>
            </div>
          ) : (
            <p className={styles.noData}>No major local variations from state law at this time.</p>
          )}
        </div>
      )}
      
      {activeTab === 'resources' && (
        <div className={styles.panel}>
          <h3>Official Resources & Contacts</h3>
          
          <div className={styles.resourceSection}>
            {resources?.general && (
              <div className={styles.resourceCard}>
                <h4>📖 NRA-ILA Full Guide</h4>
                <a href={resources.general} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                  {stateName} Gun Laws & Regulations
                  <span className={styles.externalIcon}>↗</span>
                </a>
              </div>
            )}
            
            {resources?.state_official && (
              <div className={styles.resourceCard}>
                <h4>🏛️ Official State Resources</h4>
                {Object.entries(resources.state_official).map(([label, url]) => (
                  <a key={label} href={url} target="_blank" rel="noopener noreferrer" className={styles.resourceLink}>
                    {label}
                    <span className={styles.externalIcon}>↗</span>
                  </a>
                ))}
              </div>
            )}
            
            <div className={styles.resourceCard}>
              <h4>🔍 Quick Research Tips</h4>
              <ul className={styles.tips}>
                <li>Call your local sheriff's office for concealed carry permit questions</li>
                <li>Check city & county websites for local ordinances</li>
                <li>Bookmark NRA-ILA for the authoritative source</li>
                <li>Verify laws before any interstate travel with firearms</li>
              </ul>
            </div>
          </div>
        </div>
      )}
      
      {/* Data Version Badge */}
      <div className={styles.footer}>
        <small>
          Enhanced law data v2.0 • Last updated {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : 'N/A'} •
          <a href="https://www.nraila.org/gun-laws/state-gun-laws/" target="_blank" rel="noopener noreferrer">
            NRA-ILA Source
          </a>
        </small>
      </div>
    </div>
  )
}
