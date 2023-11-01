library(tidyverse)

# Generate Data
set.seed(1234)  # Setting seed for reproducibility
dates <- seq(as.Date("2023-01-01"), by = "day", length.out = 365)

# Generate pool attendance with a sine curve + noise
pool_attendance <- round(100 + 75 * sin(2 * pi * (1:365) / 365 + pi/2) + rnorm(365, 0, 10))
pool_attendance <- scales::rescale(pool_attendance*-1,c(0.01,0.06))

# Generate ice cream consumption based on pool attendance + noise
ice_cream <- round(pool_attendance * 1.5 + 50 * sin(2 * pi * (1:365) / 365 + pi/2) + rnorm(365, 0, 20))
ice_cream <- scales::rescale(ice_cream*-1,c(0.01,0.04))

data <- data.frame(Date = dates, Pool_Attendance = pool_attendance, Ice_Cream_Consumption = ice_cream)

# Plot consumptions on y and date on x
ggplot(data, aes(x = Date)) +
  geom_line(aes(y = Pool_Attendance, color = "Pool Attendance")) +
  geom_line(aes(y = Ice_Cream_Consumption, color = "Ice Cream Consumption")) +
  labs(title = "Pool Attendance and Ice Cream Consumption (% in population) over Time", 
       y = "% in population", x = "Date", color = "Legend") +
  theme_minimal()

# plot pool attendance as function of consumption of ice cream
ggplot(data,aes(x=Ice_Cream_Consumption,y=Pool_Attendance)) +
  geom_point() + geom_smooth(method="lm")

# plot the reverse
ggplot(data,aes(x=Pool_Attendance,y=Ice_Cream_Consumption)) +
  geom_point() + geom_smooth(method="lm")

control <- sample(c(1,2,3,4,5),prob = c(0.2,0.25,0.35,0.15,0.05),replace = TRUE,size=500)
treatment <- sample(c(1,2,3,4,5),prob = c(0.1,0.2,0.35,0.2,0.15),replace=TRUE,size=500)

t.test(control,treatment)

write_csv(tibble(value=c(control,treatment),treatment=c(rep(0,500),rep(1,500))),
          "~/Desktop/RCT_data.csv")

df <- read_csv("~/Desktop/RCT_data.csv")

values_control <- df$value[df$treatment==0]
values_treatment <- df$value[df$treatment==1]
t.test(values_control,values_treatment)

values_control <- df |> filter(treatment==0) |> pull(value)
values_treatment <- df |> filter(treatment==1) |> pull(value)

my_table <- table(df$value,df$treatment)

chisq.test(my_table)

df <- read_stata("~/Downloads/DC 2021 v1.dta")

ggplot(df,aes(x=age_in_years,y=dc21_leader_ratings_23)) +
  geom_point() + geom_smooth()

ggplot(df |>
         filter(dc21_leader_ratings_23!=-99),
       aes(
         x=age_in_years,
         y=dc21_leader_ratings_23
         )
       ) +
  geom_point(alpha=0.1) +
  geom_smooth(method="lm") +
  geom_smooth(color="red")

summary(df$age_in_years)

df$age_group <- cut(df$age_in_years,c(0,17,24,34,44,54,64,74,120))

ggplot(df |>
         filter(dc21_leader_ratings_23!=-99),
       aes(
         x=age_group,
         y=dc21_leader_ratings_23
       )
) +
  geom_boxplot()

# Densities

ggplot(df |>
         filter(dc21_leader_ratings_23!=-99),
       aes(
         fill=age_group,
         x=dc21_leader_ratings_23
       )
) +
  geom_density(alpha=0.2)

# Multiple leaders by adding geom_line

# Multiple leaders by pivoting

df |>
  select(dc21_leader_ratings_23,dc21_leader_ratings_24,dc21_leader_ratings_25,age_group) |>
  filter(dc21_leader_ratings_23!=-99,dc21_leader_ratings_24!=-99,dc21_leader_ratings_25!=-99) |>
  pivot_longer(cols=-c(age_group),names_to = "leader",values_to = "rating") |>
  ggplot(aes(x=age_group,y=rating)) + geom_boxplot() + facet_wrap(~leader)

df |> 
  select(dc21_vote_2019,age_group) |>
  group_by(dc21_vote_2019,age_group) |>
  count() |>
  group_by(age_group) |>
  mutate(percent=n/sum(n)) |>
  ggplot(aes(x=age_group,y=percent,fill=as_factor(dc21_vote_2019))) +
  geom_bar(stat='identity',position='dodge') +
  scale_fill_manual(values=c("grey","red","darkblue","orange","lightblue","darkgreen","pink","grey10"))

# Categorical choice as a function of continuous
# We usually use a more sophisticated model: https://stats.oarc.ucla.edu/r/dae/multinomial-logistic-regression/
# If the outcome is ordered: https://stats.oarc.ucla.edu/r/dae/ordinal-logistic-regression/
# You could just group the independent variable