import { Router } from 'express'
import { callLlmPrompt } from '../llm/providers.js'
import { resolveProvider } from '../config.js'
import { store } from '../store/index.js'
import { requireAuth, requireFaculty, type AuthedRequest } from '../auth/middleware.js'

export const v2Router = Router()

// Pre-built templates
v2Router.get('/templates', (_req, res) => {
  res.json({
    templates: [
      {
        id: 'v2-supply-chain-crisis',
        title: 'Supply Chain Disruption Management',
        industry: 'Manufacturing & Operations',
        difficulty: 'Intermediate',
        duration: '30 minutes',
      },
      {
        id: 'v2-marketing-budget-allocation',
        title: 'Omnichannel Marketing & Brand Launch',
        industry: 'FMCG / Consumer Goods',
        difficulty: 'Beginner',
        duration: '25 minutes',
      },
    ],
  })
})

// Get V2 Simulation from database
v2Router.get('/simulations/:id', async (req, res) => {
  try {
    const sim = await store.getSimulation(req.params.id, { allowPublic: true })
    if (sim?.v2Data) {
      return res.json({ simulation: sim.v2Data, record: sim })
    }
    if (sim) {
      return res.json({ record: sim })
    }
    res.status(404).json({ error: 'Simulation not found' })
  } catch (err) {
    res.status(500).json({ error: 'Failed to retrieve simulation' })
  }
})

// Save / update V2 Simulation in database
v2Router.post('/simulations', requireAuth, requireFaculty, async (req: AuthedRequest, res) => {
  const simulation = req.body?.simulation
  if (!simulation || !simulation.id) {
    return res.status(400).json({ error: 'Simulation data with ID is required' })
  }

  const orgId = req.auth!.orgId
  const userId = req.auth!.userId

  try {
    const existing = await store.getSimulation(simulation.id, { orgId })
    let saved
    if (existing) {
      saved = await store.updateSimulation(simulation.id, orgId, {
        v2Data: simulation,
        meta: {
          ...existing.meta,
          title: simulation.title || existing.meta.title,
          industry: simulation.industry || existing.meta.industry,
          difficulty: simulation.difficulty || existing.meta.difficulty,
          duration: simulation.duration || existing.meta.duration,
          learningObjectives: simulation.learningObjectives || existing.meta.learningObjectives,
        },
        isPublished: true,
        aiGenerationComplete: true,
      })
    } else {
      saved = await store.createSimulation(
        {
          title: simulation.title,
          domain: simulation.industry || 'Strategy & Operations',
          industry: simulation.industry || 'General Business',
          difficulty: simulation.difficulty || 'Intermediate',
          duration: simulation.duration || '30 minutes',
          learningObjectives: simulation.learningObjectives || ['Strategic Decision Making'],
        },
        orgId,
        userId,
        simulation
      )
    }

    res.status(200).json({ success: true, simulation: saved?.v2Data ?? simulation, record: saved })
  } catch (err) {
    console.error('Failed to save V2 simulation:', err)
    res.status(500).json({ error: 'Failed to persist simulation to database' })
  }
})

// Genie AI-Assisted V2 Simulation Generator
v2Router.post('/ai/generate', async (req, res) => {
  const { prompt, facultyInputs } = req.body as {
    prompt?: string
    facultyInputs?: {
      title?: string
      industry?: string
      difficulty?: string
      duration?: string
      companyName?: string
      companyOverview?: string
      learningObjectives?: string[]
      scenarios?: string[]
      financialKpis?: string[]
      operationalKpis?: string[]
      constraintsRules?: string[]
      evaluationCriteria?: string[]
    }
  }

  if (!prompt && !facultyInputs?.title) {
    return res.status(400).json({ error: 'Prompt or faculty details are required' })
  }

  const title = facultyInputs?.title || prompt?.slice(0, 45) || 'Executive Operations Strategy'
  const industry = facultyInputs?.industry || 'Manufacturing & Strategy'
  const companyName = facultyInputs?.companyName || 'Apex Industrial Holdings'
  const difficulty = facultyInputs?.difficulty || 'Intermediate'
  const duration = facultyInputs?.duration || '30 minutes'

  const provider = resolveProvider()

  // Generate fallback Genie simulation tailored to faculty inputs
  const buildGenieSimulation = () => {
    const objectives =
      facultyInputs?.learningObjectives && facultyInputs.learningObjectives.length > 0
        ? facultyInputs.learningObjectives
        : [
            'Evaluate capital allocation under working capital and debt constraints',
            'Balance production capacity and inventory against fluctuating market demand',
            'Mitigate operational and quality risks while defending operating margin',
          ]

    const rounds = [
      {
        roundNumber: 1,
        title: 'Phase 1: Market Baseline & Strategic Capital Allocation',
        role: 'Chief Operating Officer & Strategic Planner',
        company: companyName,
        situationBrief:
          facultyInputs?.companyOverview ||
          `Welcome to ${companyName}. As the newly appointed leadership team, your immediate mandate is to review initial financials and operational bottlenecks, prioritize capital investments, and establish supply chain stability.`,
        bulletPoints: [
          'Initial cash reserves stand at ₹5.00 Cr with working capital tight.',
          'Customer service satisfaction has slipped to 72% due to backorders.',
          'Operational capacity is strained at 85% utilization with rising defect rates.',
        ],
        decisions: [
          {
            id: 'd1_procurement',
            type: 'select',
            label: 'Procurement Strategy & Supplier Contract',
            description: 'Choose your primary vendor sourcing terms for raw materials.',
            options: [
              {
                id: 'opt_cost',
                label: 'Tier-1 Low-Cost Sourcing (-8% unit cost, +12% delivery risk)',
                description: 'Leverage spot market economies of scale but expose line to logistics delay.',
              },
              {
                id: 'opt_reliable',
                label: 'Domestic Dual-Source (+5% premium, 99% SLA delivery)',
                description: 'Lock in local contracted suppliers with dedicated buffer inventory.',
              },
              {
                id: 'opt_just_in_time',
                label: 'Agile JIT Flow (Zero inventory holding, sensitive to disruptions)',
                description: 'Minimize carrying costs while requiring continuous vendor tracking.',
              },
            ],
          },
          {
            id: 'd1_budget_alloc',
            type: 'allocate',
            label: 'Capital & Operating Budget Allocation (₹ Cr)',
            description: 'Distribute your Phase 1 capital reserve across critical departments.',
            totalBudget: 2.0,
            budgetUnit: '₹ Cr',
            allocateItems: [
              { id: 'alloc_rd', label: 'R&D & Quality Automation', min: 0.2, max: 1.0, defaultVal: 0.5 },
              { id: 'alloc_capacity', label: 'Production Line Expansion', min: 0.2, max: 1.0, defaultVal: 0.8 },
              { id: 'alloc_marketing', label: 'Customer Acquisition & Branding', min: 0.2, max: 1.0, defaultVal: 0.7 },
            ],
          },
          {
            id: 'd1_price_slider',
            type: 'slider',
            label: 'Unit Market Price Adjustment (%)',
            description: 'Calibrate base wholesale pricing against competitor benchmarks.',
            min: -15,
            max: 20,
            step: 1,
            unitLabel: '%',
            defaultValue: 0,
          },
        ],
        rules: [
          {
            id: 'rule_procure_cost',
            name: 'Low-cost procurement margin impact',
            conditions: [{ targetType: 'decision', targetId: 'd1_procurement', operator: 'equals', value: 'opt_cost' }],
            variableDeltas: [
              { variableId: 'cash', operation: 'add', value: 400000 },
              { variableId: 'profit_margin', operation: 'add', value: 3.5 },
              { variableId: 'customer_sat', operation: 'add', value: -6.0 },
            ],
            narrativeFeedback:
              'Low-cost sourcing expanded gross margin by 3.5%, but supply disruptions caused backorders, reducing customer satisfaction.',
          },
          {
            id: 'rule_procure_reliable',
            name: 'Reliable dual-source stability',
            conditions: [{ targetType: 'decision', targetId: 'd1_procurement', operator: 'equals', value: 'opt_reliable' }],
            variableDeltas: [
              { variableId: 'cash', operation: 'add', value: -300000 },
              { variableId: 'customer_sat', operation: 'add', value: 8.0 },
              { variableId: 'defect_rate', operation: 'add', value: -1.2 },
            ],
            narrativeFeedback:
              'Premium dual-sourcing increased working capital outlay by ₹30L, but on-time delivery boosted customer satisfaction to strong levels.',
          },
        ],
        events: [
          {
            id: 'event_energy_spike',
            title: 'Industrial Energy Tariff Surcharge',
            description: 'State utility increases peak industrial electricity tariffs by 12%.',
            triggerType: 'round',
            triggerRound: 1,
            impactDeltas: [{ variableId: 'cash', operation: 'add', value: -150000 }],
            narrative: 'Rising utility rates decreased operating cash reserves by ₹1.5 Lakh.',
            severity: 'warning',
          },
        ],
      },
      {
        roundNumber: 2,
        title: 'Phase 2: Operational Scaling & Demand Volatility',
        role: 'Executive Vice President of Operations',
        company: companyName,
        situationBrief:
          'In Phase 2, market demand surges by 18% as competitors face manufacturing delays. You must choose how aggressively to ramp headcount and inventory while containing quality defect rates.',
        bulletPoints: [
          'Order backlog has grown to ₹1.80 Cr with lead times stretching.',
          'Worker overtime has increased labor costs by 15%.',
          'A key competitor is launching a discounted product line next quarter.',
        ],
        decisions: [
          {
            id: 'd2_expansion_tactic',
            type: 'select',
            label: 'Production Shift & Overtime Policy',
            description: 'Determine factory operating schedule to meet order backlog.',
            options: [
              {
                id: 'shift_double',
                label: 'Add 2nd Full Shift (+40% output, +₹60L fixed overhead)',
                description: 'Recruit and train a secondary manufacturing crew.',
              },
              {
                id: 'shift_overtime',
                label: 'Mandatory Weekend Overtime (+15% output, +fatigue risk)',
                description: 'Leverage current staff with 1.5x hourly premium wages.',
              },
              {
                id: 'shift_subcontract',
                label: 'Outsource Overflow to Third-Party Partner (Preserves cash, variable cost)',
                description: 'Contract third-party toller for peak volumes.',
              },
            ],
          },
          {
            id: 'd2_tech_investment',
            type: 'slider',
            label: 'Predictive Maintenance & Automation CapEx (₹ Lakh)',
            description: 'Invest in IoT sensors and automated optical inspection systems.',
            min: 10,
            max: 80,
            step: 5,
            unitLabel: '₹ Lakh',
            defaultValue: 30,
          },
        ],
        rules: [
          {
            id: 'rule_double_shift',
            name: 'Double shift capacity expansion',
            conditions: [{ targetType: 'decision', targetId: 'd2_expansion_tactic', operator: 'equals', value: 'shift_double' }],
            variableDeltas: [
              { variableId: 'revenue', operation: 'add', value: 2400000 },
              { variableId: 'cash', operation: 'add', value: -600000 },
              { variableId: 'capacity_util', operation: 'add', value: -15.0 },
            ],
            narrativeFeedback:
              'Double shifts cleared backlog generating ₹24L incremental revenue, though fixed payroll costs consumed ₹60L upfront.',
          },
        ],
        events: [],
      },
      {
        roundNumber: 3,
        title: 'Phase 3: Competitive Price War & Margin Defense',
        role: 'Chief Executive Officer',
        company: companyName,
        situationBrief:
          'An aggressive global competitor cuts pricing by 10% across key accounts. You must execute your final round strategy to defend market share while ensuring long-term profitability.',
        bulletPoints: [
          'Customer churn rate increased by 4% in Tier-2 distributor accounts.',
          'Board of Directors expects minimum Return on Capital of 18%.',
          'Free cash flow will dictate next fiscal year expansion plans.',
        ],
        decisions: [
          {
            id: 'd3_competitive_response',
            type: 'select',
            label: 'Commercial & Pricing Defense Policy',
            description: 'Choose corporate posture against rival price war.',
            options: [
              {
                id: 'resp_match_price',
                label: 'Match Price Cut (-10% price, protect volume, compress margin)',
                description: 'Defend market share at expense of short term EBITDA margin.',
              },
              {
                id: 'resp_premium_value',
                label: 'Hold Price & Bundle Extended Warranty (+Customer loyalty, premium position)',
                description: 'Emphasize superior quality, certified SLA, and client partnership.',
              },
              {
                id: 'resp_niche_focus',
                label: 'Cede Commodity Volume & Pivot to High-Margin Specialty Accounts',
                description: 'Shed low-margin volume to focus solely on high-yield contracts.',
              },
            ],
          },
        ],
        rules: [
          {
            id: 'rule_hold_price',
            name: 'Premium value preservation',
            conditions: [
              { targetType: 'decision', targetId: 'd3_competitive_response', operator: 'equals', value: 'resp_premium_value' },
            ],
            variableDeltas: [
              { variableId: 'profit_margin', operation: 'add', value: 2.0 },
              { variableId: 'customer_sat', operation: 'add', value: 5.0 },
              { variableId: 'revenue', operation: 'add', value: 1200000 },
            ],
            narrativeFeedback:
              'Holding price and bundling high-touch support defended operating margin and reinforced customer trust.',
          },
        ],
        events: [],
      },
    ]

    const variables = [
      {
        id: 'cash',
        label: 'Cash Reserves',
        description: 'Liquid cash available for operating expenses and CapEx.',
        unit: 'currency_inr',
        category: 'financial',
        initialValue: 5000000,
        currentValue: 5000000,
        min: 0,
        max: 15000000,
        targetDirection: 'higher_is_better',
        benchmark: 6000000,
      },
      {
        id: 'revenue',
        label: 'Cumulative Revenue',
        description: 'Total sales proceeds generated across simulation phases.',
        unit: 'currency_inr',
        category: 'financial',
        initialValue: 12000000,
        currentValue: 12000000,
        min: 0,
        max: 35000000,
        targetDirection: 'higher_is_better',
        benchmark: 20000000,
      },
      {
        id: 'profit_margin',
        label: 'Operating Profit Margin',
        description: 'Operating income divided by net sales.',
        unit: 'percent',
        category: 'financial',
        initialValue: 18.5,
        currentValue: 18.5,
        min: 0,
        max: 40,
        targetDirection: 'higher_is_better',
        benchmark: 22.0,
      },
      {
        id: 'capacity_util',
        label: 'Capacity Utilization',
        description: 'Plant output compared to maximum engineered capability.',
        unit: 'percent',
        category: 'operational',
        initialValue: 84.0,
        currentValue: 84.0,
        min: 20,
        max: 100,
        targetDirection: 'target_range',
        benchmark: 85.0,
      },
      {
        id: 'customer_sat',
        label: 'Customer Satisfaction Score (CSAT)',
        description: 'Survey index measuring delivery reliability and product quality.',
        unit: 'percent',
        category: 'market',
        initialValue: 72.0,
        currentValue: 72.0,
        min: 0,
        max: 100,
        targetDirection: 'higher_is_better',
        benchmark: 85.0,
      },
      {
        id: 'defect_rate',
        label: 'Quality Defect Rate',
        description: 'Percentage of manufactured units failing final QA inspection.',
        unit: 'percent',
        category: 'operational',
        initialValue: 3.2,
        currentValue: 3.2,
        min: 0,
        max: 10,
        targetDirection: 'lower_is_better',
        benchmark: 1.5,
      },
    ]

    return {
      id: `v2-${Date.now()}`,
      title,
      industry,
      difficulty,
      duration,
      companyName,
      companyOverview:
        facultyInputs?.companyOverview ||
        `${companyName} is an established enterprise operating in competitive B2B and consumer markets. Learners navigate executive trade-offs between cash flow, factory capacity, marketing allocation, and competitive risk.`,
      initialRole: 'Chief Operating Officer & Strategic Executive',
      learningObjectives: objectives,
      variables,
      rounds,
      version: '2.0',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  // If LLM provider is configured, call prompt
  if (provider !== 'mock') {
    const systemInstructions = `
You are an expert Capsim-style business simulation designer.
Given the faculty inputs, output ONLY a valid JSON object according to this V2 schema (no markdown, no backticks):
{
  "id": "v2-custom-sim",
  "title": "${title}",
  "industry": "${industry}",
  "difficulty": "${difficulty}",
  "duration": "${duration}",
  "companyName": "${companyName}",
  "companyOverview": "...",
  "initialRole": "Chief Operating Officer",
  "learningObjectives": ["...", "..."],
  "version": "2.0",
  "variables": [
    {
      "id": "cash",
      "label": "Cash Reserves",
      "unit": "currency_inr",
      "category": "financial",
      "initialValue": 5000000,
      "currentValue": 5000000,
      "min": 0,
      "max": 15000000,
      "targetDirection": "higher_is_better"
    }
  ],
  "rounds": [
    {
      "roundNumber": 1,
      "title": "Phase 1: ...",
      "role": "...",
      "company": "${companyName}",
      "situationBrief": "...",
      "bulletPoints": ["..."],
      "decisions": [
        {
          "id": "d1_decision",
          "type": "select",
          "label": "...",
          "options": [{ "id": "opt_a", "label": "...", "description": "..." }]
        }
      ],
      "rules": [
        {
          "id": "rule_1",
          "name": "...",
          "conditions": [{ "targetType": "decision", "targetId": "d1_decision", "operator": "equals", "value": "opt_a" }],
          "variableDeltas": [{ "variableId": "cash", "operation": "add", "value": 200000 }],
          "narrativeFeedback": "..."
        }
      ],
      "events": []
    }
  ]
}
`
    try {
      const raw = await callLlmPrompt(
        `${systemInstructions}\n\nFaculty Goal: ${prompt || title}\nCompany: ${companyName}\nIndustry: ${industry}\n\nOutput JSON:`,
        provider,
        { maxTokens: 3800 }
      )
      const cleaned = raw.replace(/```json/g, '').replace(/```/g, '').trim()
      const parsed = JSON.parse(cleaned)
      return res.json({ simulation: parsed, source: provider })
    } catch (err) {
      console.warn('[V2 Genie AI] LLM error, using intelligent fallback:', err)
    }
  }

  // Use intelligent structured generator
  const generated = buildGenieSimulation()
  res.json({ simulation: generated, source: 'genie-engine' })
})
