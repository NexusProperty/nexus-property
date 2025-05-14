import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip } from '@/components/ui/tooltip';
import { 
  TrendingUp, 
  TrendingDown, 
  AlertTriangle, 
  Info, 
  Target, 
  Lightbulb, 
  BarChart, 
  LineChart, 
  PieChart,
  RefreshCw,
  Calendar,
  Home
} from 'lucide-react';

export interface MarketInsight {
  id: string;
  type: 'positive' | 'negative' | 'neutral' | 'warning';
  title: string;
  description: string;
  source?: string;
  timestamp?: string;
  impact?: 'high' | 'medium' | 'low';
}

export interface MarketTrend {
  period: string;
  value: number;
  change: number;
}

export interface SuburbStats {
  suburb: string;
  medianPrice: number;
  avgDaysOnMarket: number;
  salesVolume: number;
  priceChange3Months: number;
  priceChange1Year: number;
}

interface MarketAnalysisProps {
  appraisalId: string;
  propertyType: string;
  propertySuburb: string;
  propertyCity: string;
  insights: MarketInsight[];
  priceHistory: MarketTrend[];
  suburbStats: SuburbStats;
  loading: boolean;
  onRefreshAnalysis: () => void;
}

export function MarketAnalysis({
  appraisalId,
  propertyType,
  propertySuburb,
  propertyCity,
  insights,
  priceHistory,
  suburbStats,
  loading,
  onRefreshAnalysis
}: MarketAnalysisProps) {
  const [activeTab, setActiveTab] = useState('insights');

  const formatCurrency = (value: number | null): string => {
    if (value === null) return 'N/A';
    return new Intl.NumberFormat('en-NZ', {
      style: 'currency',
      currency: 'NZD',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatPercentage = (value: number | null): string => {
    if (value === null) return 'N/A';
    return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const getInsightIcon = (type: string, impact?: string) => {
    switch (type) {
      case 'positive':
        return <TrendingUp className={`h-5 w-5 ${impact === 'high' ? 'text-green-600' : 'text-green-500'}`} />;
      case 'negative':
        return <TrendingDown className={`h-5 w-5 ${impact === 'high' ? 'text-red-600' : 'text-red-500'}`} />;
      case 'warning':
        return <AlertTriangle className={`h-5 w-5 ${impact === 'high' ? 'text-amber-600' : 'text-amber-500'}`} />;
      default:
        return <Info className={`h-5 w-5 ${impact === 'high' ? 'text-blue-600' : 'text-blue-500'}`} />;
    }
  };

  const getImpactBadge = (impact?: string) => {
    if (!impact) return null;
    
    switch (impact) {
      case 'high':
        return <Badge variant="outline" className="ml-2 bg-red-50 text-red-700 border-red-200">High Impact</Badge>;
      case 'medium':
        return <Badge variant="outline" className="ml-2 bg-amber-50 text-amber-700 border-amber-200">Medium Impact</Badge>;
      case 'low':
        return <Badge variant="outline" className="ml-2 bg-green-50 text-green-700 border-green-200">Low Impact</Badge>;
      default:
        return null;
    }
  };

  const getTrendIndicator = (value: number) => {
    if (value > 3) {
      return <TrendingUp className="h-4 w-4 text-green-500 ml-1" />;
    } else if (value < -3) {
      return <TrendingDown className="h-4 w-4 text-red-500 ml-1" />;
    }
    return null;
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Market Analysis</CardTitle>
            <CardDescription>
              AI-powered market insights for {propertyType}s in {propertySuburb}, {propertyCity}
            </CardDescription>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={onRefreshAnalysis}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh Analysis
          </Button>
        </div>
      </CardHeader>
      
      <CardContent>
        <Tabs defaultValue="insights" value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="insights">
              <Lightbulb className="h-4 w-4 mr-2" />
              Insights
            </TabsTrigger>
            <TabsTrigger value="trends">
              <LineChart className="h-4 w-4 mr-2" />
              Price Trends
            </TabsTrigger>
            <TabsTrigger value="stats">
              <BarChart className="h-4 w-4 mr-2" />
              Suburb Stats
            </TabsTrigger>
          </TabsList>
          
          {loading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-900"></div>
            </div>
          ) : (
            <>
              <TabsContent value="insights" className="mt-6">
                {insights.length === 0 ? (
                  <div className="text-center p-8">
                    <p className="text-gray-500">No market insights available yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {insights.map((insight) => (
                      <div 
                        key={insight.id} 
                        className={`p-4 rounded-lg border ${
                          insight.type === 'positive' ? 'bg-green-50 border-green-200' : 
                          insight.type === 'negative' ? 'bg-red-50 border-red-200' :
                          insight.type === 'warning' ? 'bg-amber-50 border-amber-200' :
                          'bg-blue-50 border-blue-200'
                        }`}
                      >
                        <div className="flex">
                          <div className="flex-shrink-0 mr-3">
                            {getInsightIcon(insight.type, insight.impact)}
                          </div>
                          <div>
                            <div className="flex items-center">
                              <h4 className="font-medium">{insight.title}</h4>
                              {getImpactBadge(insight.impact)}
                            </div>
                            <p className="mt-1 text-sm">{insight.description}</p>
                            {insight.source && (
                              <p className="mt-2 text-xs text-gray-500">
                                Source: {insight.source}
                                {insight.timestamp && ` • ${insight.timestamp}`}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </TabsContent>
              
              <TabsContent value="trends" className="mt-6">
                <div>
                  <h3 className="text-lg font-medium mb-4">Price Trends for {propertyType}s in {propertySuburb}</h3>
                  
                  {priceHistory.length === 0 ? (
                    <div className="text-center p-8">
                      <p className="text-gray-500">No price trend data available yet.</p>
                    </div>
                  ) : (
                    <>
                      <div className="h-[240px] bg-gray-50 p-4 rounded-lg mb-4 flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <LineChart className="h-8 w-8 mx-auto mb-2" />
                          <p>Price trend chart visualization coming soon</p>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        {priceHistory.map((trend, idx) => (
                          <Card key={idx}>
                            <CardContent className="p-4">
                              <div className="flex items-center mb-1">
                                <Calendar className="h-4 w-4 text-gray-500 mr-2" />
                                <span className="text-sm font-medium">{trend.period}</span>
                              </div>
                              <div className="text-xl font-bold">{formatCurrency(trend.value)}</div>
                              <div className="flex items-center mt-1">
                                <span className={`text-sm ${
                                  trend.change > 0 ? 'text-green-600' : 
                                  trend.change < 0 ? 'text-red-600' : 
                                  'text-gray-600'
                                }`}>
                                  {formatPercentage(trend.change)}
                                </span>
                                {getTrendIndicator(trend.change)}
                              </div>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </TabsContent>
              
              <TabsContent value="stats" className="mt-6">
                {!suburbStats ? (
                  <div className="text-center p-8">
                    <p className="text-gray-500">No suburb statistics available yet.</p>
                  </div>
                ) : (
                  <div>
                    <h3 className="text-lg font-medium mb-4">
                      {suburbStats.suburb} Market Statistics
                    </h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Median Sale Price</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex justify-between items-center">
                            <span className="text-2xl font-bold">{formatCurrency(suburbStats.medianPrice)}</span>
                            <div>
                              <div className="flex items-center text-sm">
                                <span className={suburbStats.priceChange3Months >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatPercentage(suburbStats.priceChange3Months)} (3 months)
                                </span>
                                {getTrendIndicator(suburbStats.priceChange3Months)}
                              </div>
                              <div className="flex items-center text-sm mt-1">
                                <span className={suburbStats.priceChange1Year >= 0 ? 'text-green-600' : 'text-red-600'}>
                                  {formatPercentage(suburbStats.priceChange1Year)} (1 year)
                                </span>
                                {getTrendIndicator(suburbStats.priceChange1Year)}
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                      
                      <Card>
                        <CardHeader className="pb-2">
                          <CardTitle className="text-base">Market Activity</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <div className="text-sm text-gray-500">Properties Sold</div>
                              <div className="text-xl font-bold">{suburbStats.salesVolume}</div>
                              <div className="text-xs text-gray-500">Last 3 months</div>
                            </div>
                            <div>
                              <div className="text-sm text-gray-500">Days on Market</div>
                              <div className="text-xl font-bold">{suburbStats.avgDaysOnMarket}</div>
                              <div className="text-xs text-gray-500">Average</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                    
                    <div className="mt-6">
                      <h4 className="text-base font-medium mb-3">Similar Properties Breakdown</h4>
                      <div className="h-[180px] bg-gray-50 p-4 rounded-lg flex items-center justify-center">
                        <div className="text-center text-gray-500">
                          <PieChart className="h-8 w-8 mx-auto mb-2" />
                          <p>Property type distribution chart coming soon</p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </>
          )}
        </Tabs>
      </CardContent>
      
      <CardFooter className="border-t pt-4 text-sm text-gray-500">
        <div className="flex items-center">
          <Info className="h-4 w-4 mr-2" />
          Market data is updated weekly. Last updated: {new Date().toLocaleDateString()}
        </div>
      </CardFooter>
    </Card>
  );
} 