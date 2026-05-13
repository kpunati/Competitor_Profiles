/**
 * enrich.ts
 *
 * Fills Competitors/{Name}/Source_Data/company_facts.json with information
 * we can't get from scraping their website:
 *   - Company size, founding date, headquarters
 *   - Funding history and leadership
 *   - Traffic estimates and channels
 *   - Social following
 *   - Review scores and counts
 *
 * Recommendation: start manual. The schema in company_facts.json works as a
 * checklist — spend 15 minutes per competitor pulling from LinkedIn,
 * Crunchbase, SimilarWeb (free tier), G2. Automate only the fields that
 * prove useful across many competitors.
 */

export {};
