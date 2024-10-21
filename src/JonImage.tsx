import { Card, CardContent, Typography, CardActions, Button } from "@mui/material";

export type Props = {
  title?: string;
  source: string;
  buttons?: { text: string, onClick: () => void }[];
}

export const JonImage = ({ title, source, buttons }: Props) => <Card variant="outlined" sx={{ display: "inline-block", margin: "1em 1em 1em 0" }}>
  <CardContent>
    <Typography variant="subtitle1" sx={{ color: 'text.secondary' }}>
      {title}
    </Typography>
    <img src={source} />
  </CardContent>
  {buttons && buttons.length > 0 && <CardActions>
    {buttons.map((button) => <Button size="small" onClick={button.onClick}>{button.text}</Button>)}
  </CardActions>}
</Card>;
