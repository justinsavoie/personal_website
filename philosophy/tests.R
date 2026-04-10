# Load philosophers_ollama.json and produce a long data frame
# Requires: jsonlite, dplyr, tidyr
library(jsonlite)
library(dplyr)
library(tidyr)

ollama_path <- "~/Documents/personal_repos/ai_creative/philosophy-compass/version-2026-01-29/data/philosophers_ollama.json"
phils <- fromJSON(ollama_path, flatten = TRUE)

# Handle both possible shapes:
# - positions.1 ... positions.30 columns (flattened)
# - a list-column `positions` (unflattened)
if (any(grepl("^positions\\.", names(phils)))) {
  df_positions_long <- phils %>%
    pivot_longer(
      starts_with("positions."),
      names_to = "QID",
      names_pattern = "positions\\.(\\d+)",
      values_to = "Position"
    ) %>%
    mutate(QID = paste0("Q", QID)) %>%
    select(philosopher, QID, Position, justification)
} else {
  df_positions_long <- phils %>%
    unnest_longer(positions) %>%
    group_by(philosopher, justification) %>%
    mutate(QID = paste0("Q", row_number())) %>%
    ungroup() %>%
    rename(Position = positions) %>%
    select(philosopher, QID, Position, justification)
}

df_positions_long
# Build a 30x2 question map (QID, Question) from model.json
# Requires: jsonlite, dplyr
library(jsonlite)
library(dplyr)

model <- fromJSON("~/Documents/personal_repos/ai_creative/philosophy-compass/version-2026-01-29/data/model.json")
qmap <- as_tibble(model$questions) %>%
  transmute(QID = id, Question = text)

qmap

df_positions_long <- df_positions_long %>%
   left_join(qmap, by = "QID") %>%
   relocate(Question, .after = QID)

df_positions_wide <- df_positions_long %>% select(philosopher,QID,Position) %>% spread(QID,Position)

library(factoextra)

temp <- as.data.frame(df_positions_wide[,2:31])
row.names(temp) <- df_positions_wide$philosopher
fviz_pca_biplot(prcomp(temp))

