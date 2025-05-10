import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { fetchUserTeams } from "@/services/teamService";
import { Team } from "@/types/team";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDate } from "@/lib/utils";
import { Plus, Users } from "lucide-react";

// Team card component
const TeamCard = ({ team }: { team: Team }) => {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg font-medium line-clamp-1">
            {team.name}
          </CardTitle>
        </div>
      </CardHeader>
      <CardContent className="pb-2 flex-grow">
        <div className="text-sm text-muted-foreground">
          {team.description && <p className="mb-2">{team.description}</p>}
          <p>Created: {formatDate(team.created_at)}</p>
          {team.updated_at && (
            <p>Updated: {formatDate(team.updated_at)}</p>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button variant="outline" size="sm" asChild className="w-full">
          <Link to={`/agent/team/${team.id}`}>Manage Team</Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

// Loading skeleton
const TeamCardSkeleton = () => {
  return (
    <Card className="h-full">
      <CardHeader className="pb-2">
        <div className="flex justify-between items-start">
          <Skeleton className="h-6 w-3/4" />
        </div>
      </CardHeader>
      <CardContent className="pb-2">
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-1/2 mb-2" />
        <Skeleton className="h-4 w-1/3" />
      </CardContent>
      <CardFooter>
        <Skeleton className="h-9 w-full" />
      </CardFooter>
    </Card>
  );
};

// Empty state
const EmptyState = () => {
  return (
    <div className="text-center py-12">
      <div className="flex justify-center mb-4">
        <Users className="h-12 w-12 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-medium mb-2">No teams found</h3>
      <p className="text-muted-foreground mb-4">
        You haven't created or joined any teams yet.
      </p>
      <Button asChild>
        <Link to="/agent/team/create">Create Your First Team</Link>
      </Button>
    </div>
  );
};

// Main component
export const TeamList = () => {
  const { data: teams, isLoading, error } = useQuery({
    queryKey: ["teams"],
    queryFn: fetchUserTeams,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, index) => (
          <TeamCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium mb-2">Error loading teams</h3>
        <p className="text-muted-foreground mb-4">
          There was a problem loading your teams. Please try again later.
        </p>
        <Button onClick={() => window.location.reload()}>Retry</Button>
      </div>
    );
  }

  if (!teams || teams.length === 0) {
    return <EmptyState />;
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Your Teams</h2>
        <Button asChild>
          <Link to="/agent/team/create">
            <Plus className="mr-2 h-4 w-4" />
            Create Team
          </Link>
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {teams.map((team) => (
          <TeamCard key={team.id} team={team} />
        ))}
      </div>
    </div>
  );
}; 