import { useState, useEffect } from "react";
import { Box, Container, Grid, Paper, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "../app/store";
import StreamPlayer from "./StreamPlayer";
import useWebSocket from "../hooks/useWebSocket";

interface Classroom {
  id: number;
  name: string;
  rtmp_endpoint: string;
  stream_status: string;
}

interface StreamStatus {
  classroom_id: number;
  status: string;
  viewer_count: number;
  bitrate: number;
  resolution: string;
}

const Dashboard = () => {
  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [selectedClassroom, setSelectedClassroom] = useState<Classroom | null>(
    null
  );
  const [streamStatuses, setStreamStatuses] = useState<
    Record<number, StreamStatus>
  >({});

  const token = useSelector((state: RootState) => state.auth.token);

  useEffect(() => {
    const fetchClassrooms = async () => {
      try {
        const response = await fetch("http://localhost:8000/classrooms", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const data = await response.json();
        setClassrooms(data);
      } catch (error) {
        console.error("Error fetching classrooms:", error);
      }
    };

    fetchClassrooms();
  }, [token]);

  // WebSocket connection for real-time updates
  const onMessage = (message: any) => {
    const status = JSON.parse(message);
    setStreamStatuses((prev) => ({
      ...prev,
      [status.classroom_id]: status,
    }));
  };

  useWebSocket("ws://localhost:8000/ws/stream-status", onMessage);

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Classrooms
            </Typography>
            {classrooms.map((classroom) => (
              <Box
                key={classroom.id}
                sx={{
                  p: 2,
                  mb: 1,
                  border: 1,
                  borderColor: "grey.300",
                  borderRadius: 1,
                  cursor: "pointer",
                  "&:hover": { bgcolor: "grey.100" },
                  bgcolor:
                    selectedClassroom?.id === classroom.id
                      ? "grey.200"
                      : "transparent",
                }}
                onClick={() => setSelectedClassroom(classroom)}
              >
                <Typography variant="subtitle1">{classroom.name}</Typography>
                <Typography
                  variant="body2"
                  color={
                    streamStatuses[classroom.id]?.status === "active"
                      ? "success.main"
                      : "error.main"
                  }
                >
                  {streamStatuses[classroom.id]?.status || "Offline"}
                </Typography>
                {streamStatuses[classroom.id] && (
                  <Typography variant="body2">
                    Viewers: {streamStatuses[classroom.id].viewer_count}
                  </Typography>
                )}
              </Box>
            ))}
          </Paper>
        </Grid>
        <Grid item xs={12} md={8}>
          {selectedClassroom ? (
            <Paper sx={{ p: 2 }}>
              <Typography variant="h6" gutterBottom>
                {selectedClassroom.name}
              </Typography>
              <StreamPlayer
                streamUrl={`http://localhost/hls/${selectedClassroom.id}/playlist.m3u8`}
              />
              {streamStatuses[selectedClassroom.id] && (
                <Box sx={{ mt: 2 }}>
                  <Typography>
                    Bitrate: {streamStatuses[selectedClassroom.id].bitrate} kbps
                  </Typography>
                  <Typography>
                    Resolution:{" "}
                    {streamStatuses[selectedClassroom.id].resolution}
                  </Typography>
                </Box>
              )}
            </Paper>
          ) : (
            <Paper sx={{ p: 2 }}>
              <Typography>Select a classroom to view the stream</Typography>
            </Paper>
          )}
        </Grid>
      </Grid>
    </Container>
  );
};

export default Dashboard;
