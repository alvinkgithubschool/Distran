package com.distran.app.ui

import android.net.Uri
import androidx.compose.animation.AnimatedVisibility
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.navigationBarsPadding
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.statusBarsPadding
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.automirrored.outlined.FormatListBulleted
import androidx.compose.material.icons.outlined.Add
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.CompassCalibration
import androidx.compose.material.icons.automirrored.outlined.HelpOutline
import androidx.compose.material.icons.outlined.Home
import androidx.compose.material.icons.outlined.Layers
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.Person
import androidx.compose.material.icons.outlined.Search
import androidx.compose.material.icons.outlined.Settings
import androidx.compose.material3.HorizontalDivider
import androidx.compose.material3.Icon
import androidx.compose.material3.IconButton
import androidx.compose.material3.Scaffold
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.runtime.Composable
import androidx.compose.runtime.LaunchedEffect
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.remember
import androidx.compose.runtime.setValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.lifecycle.viewmodel.compose.viewModel
import androidx.navigation.NavType
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.currentBackStackEntryAsState
import androidx.navigation.compose.rememberNavController
import androidx.navigation.navArgument
import com.distran.app.DistranViewModel
import com.distran.app.data.Medium
import com.distran.app.ui.components.DistranWordmark
import com.distran.app.ui.components.FormatSwitcherDialog
import com.distran.app.ui.components.LogEditorDialog
import com.distran.app.ui.components.NotificationsDialog
import com.distran.app.ui.components.OrientationHelpDialog
import com.distran.app.ui.components.QuickLogDialog
import com.distran.app.ui.screens.AuthScreen
import com.distran.app.ui.screens.ChatScreen
import com.distran.app.ui.screens.CreatorDetailScreen
import com.distran.app.ui.screens.CreatorsScreen
import com.distran.app.ui.screens.DiscoverScreen
import com.distran.app.ui.screens.HomeScreen
import com.distran.app.ui.screens.ListDetailScreen
import com.distran.app.ui.screens.ListsScreen
import com.distran.app.ui.screens.OnboardingScreen
import com.distran.app.ui.screens.PartnerRoomScreen
import com.distran.app.ui.screens.ProfileScreen
import com.distran.app.ui.screens.SettingsScreen
import com.distran.app.ui.screens.TitleScreen
import com.distran.app.ui.theme.AbelFontFamily
import com.distran.app.ui.theme.DistranColors
import com.distran.app.ui.theme.DmMonoFontFamily
import kotlinx.coroutines.delay

private object Routes {
    const val AUTH = "auth"
    const val SETUP = "setup"
    const val HOME = "home"
    const val DISCOVER = "discover?medium={medium}&q={q}&scope={scope}"
    const val LISTS = "lists"
    const val LIST_DETAIL = "lists/{id}"
    const val CREATORS = "creators?q={q}"
    const val CREATOR_DETAIL = "creators/{id}"
    const val PROFILE = "profile"
    const val TITLE = "title/{id}"
    const val PARTNER_ROOM = "room/dune"
    const val CHAT = "chat"
    const val SETTINGS = "settings"

    fun discover(medium: Medium? = null, q: String = "", scope: String = ""): String {
        val m = medium?.id ?: ""
        return "discover?medium=${Uri.encode(m)}&q=${Uri.encode(q)}&scope=${Uri.encode(scope)}"
    }

    fun listDetail(id: String) = "lists/${Uri.encode(id)}"
    fun creatorDetail(id: String) = "creators/${Uri.encode(id)}"
    fun title(id: String) = "title/${Uri.encode(id)}"
    fun creators(q: String = "") = "creators?q=${Uri.encode(q)}"
}

private data class BottomNavItem(
    val label: String,
    val baseRoute: String,
    val targetRoute: String,
    val icon: ImageVector
)

@Composable
fun DistranApp(viewModel: DistranViewModel = viewModel()) {
    val state by viewModel.uiState.collectAsState()
    val account = state.account
    val navController = rememberNavController()
    val backStackEntry by navController.currentBackStackEntryAsState()
    val currentRoute = backStackEntry?.destination?.route ?: Routes.AUTH

    var formatOpen by remember { mutableStateOf(false) }
    var notificationsOpen by remember { mutableStateOf(false) }
    var helpOpen by remember { mutableStateOf(false) }
    var quickLogOpen by remember { mutableStateOf(false) }

    LaunchedEffect(state.toast) {
        if (state.toast.isNotEmpty()) {
            delay(2800L)
            viewModel.clearToast()
        }
    }

    val startDestination = remember {
        when {
            account == null -> Routes.AUTH
            !account.complete -> Routes.SETUP
            else -> Routes.HOME
        }
    }

    val showChrome = account != null && account.complete &&
            currentRoute != Routes.AUTH && currentRoute != Routes.SETUP

    fun navigateTop(route: String) {
        navController.navigate(route) {
            popUpTo(Routes.HOME) { saveState = true }
            launchSingleTop = true
            restoreState = true
        }
    }

    Box(
        modifier = Modifier
            .fillMaxSize()
            .background(DistranColors.Bg)
    ) {
        Scaffold(
            containerColor = DistranColors.Bg,
            topBar = {
                if (showChrome) {
                    DistranTopBar(
                        currentRoute = currentRoute,
                        onHome = { navigateTop(Routes.HOME) },
                        onOpenFormats = { formatOpen = true },
                        onOpenSearch = { navigateTop(Routes.discover()) },
                        onOpenNotifications = { notificationsOpen = true },
                        onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                        onQuickLog = { quickLogOpen = true },
                        onOpenHelp = { helpOpen = true }
                    )
                }
            },
            bottomBar = {
                if (showChrome) {
                    DistranBottomBar(
                        currentRoute = currentRoute,
                        onNavigate = { navigateTop(it) }
                    )
                }
            }
        ) { innerPadding ->
            NavHost(
                navController = navController,
                startDestination = startDestination,
                modifier = Modifier
                    .fillMaxSize()
                    .padding(innerPadding)
            ) {
                composable(Routes.AUTH) {
                    AuthScreen(
                        viewModel = viewModel,
                        onAuthenticated = { complete ->
                            val target = if (complete) Routes.HOME else Routes.SETUP
                            navController.navigate(target) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    )
                }

                composable(Routes.SETUP) {
                    OnboardingScreen(
                        viewModel = viewModel,
                        onFinished = {
                            navController.navigate(Routes.HOME) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    )
                }

                composable(Routes.HOME) {
                    HomeScreen(
                        viewModel = viewModel,
                        onOpenWork = { navController.navigate(Routes.title(it)) },
                        onOpenDiscover = { navigateTop(Routes.discover(medium = it)) },
                        onOpenLists = { navigateTop(Routes.LISTS) },
                        onOpenListDetail = { navController.navigate(Routes.listDetail(it)) },
                        onOpenChat = { navigateTop(Routes.CHAT) },
                        onOpenProfile = { navigateTop(Routes.PROFILE) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) },
                        onOpenPartnerRoom = { navController.navigate(Routes.PARTNER_ROOM) }
                    )
                }

                composable(
                    route = Routes.DISCOVER,
                    arguments = listOf(
                        navArgument("medium") { type = NavType.StringType; defaultValue = "" },
                        navArgument("q") { type = NavType.StringType; defaultValue = "" },
                        navArgument("scope") { type = NavType.StringType; defaultValue = "" }
                    )
                ) { entry ->
                    val mediumArg = Medium.fromId(entry.arguments?.getString("medium"))
                    val queryArg = entry.arguments?.getString("q") ?: ""
                    val scopeArg = entry.arguments?.getString("scope") == "curated"
                    DiscoverScreen(
                        viewModel = viewModel,
                        initialQuery = queryArg,
                        initialMedium = mediumArg,
                        initialCuratedScope = scopeArg,
                        onOpenWork = { navController.navigate(Routes.title(it)) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) },
                        onOpenCreatorsDirectory = { navController.navigate(Routes.creators()) },
                        onOpenChat = { navigateTop(Routes.CHAT) }
                    )
                }

                composable(Routes.LISTS) {
                    ListsScreen(
                        viewModel = viewModel,
                        onOpenListDetail = { navController.navigate(Routes.listDetail(it)) },
                        onOpenChat = { navigateTop(Routes.CHAT) }
                    )
                }

                composable(
                    route = Routes.LIST_DETAIL,
                    arguments = listOf(navArgument("id") { type = NavType.StringType })
                ) { entry ->
                    val id = entry.arguments?.getString("id") ?: ""
                    ListDetailScreen(
                        listId = id,
                        viewModel = viewModel,
                        onBackToLists = { navigateTop(Routes.LISTS) },
                        onOpenWork = { navController.navigate(Routes.title(it)) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) }
                    )
                }

                composable(
                    route = Routes.CREATORS,
                    arguments = listOf(navArgument("q") { type = NavType.StringType; defaultValue = "" })
                ) { entry ->
                    val q = entry.arguments?.getString("q") ?: ""
                    CreatorsScreen(
                        viewModel = viewModel,
                        initialQuery = q,
                        onOpenDiscover = { navigateTop(Routes.discover()) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) }
                    )
                }

                composable(
                    route = Routes.CREATOR_DETAIL,
                    arguments = listOf(navArgument("id") { type = NavType.StringType })
                ) { entry ->
                    val id = Uri.decode(entry.arguments?.getString("id") ?: "")
                    CreatorDetailScreen(
                        creatorId = id,
                        viewModel = viewModel,
                        onBackToCreators = { navController.navigate(Routes.creators()) },
                        onOpenWork = { navController.navigate(Routes.title(it)) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) },
                        onOpenDiscover = { navigateTop(Routes.discover()) },
                        onOpenSettings = { navController.navigate(Routes.SETTINGS) }
                    )
                }

                composable(Routes.PROFILE) {
                    ProfileScreen(
                        viewModel = viewModel,
                        onOpenSettings = { navController.navigate(Routes.SETTINGS) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) },
                        onOpenWork = { navController.navigate(Routes.title(it)) },
                        onOpenListDetail = { navController.navigate(Routes.listDetail(it)) },
                        onOpenLists = { navigateTop(Routes.LISTS) },
                        onOpenDiscover = { navigateTop(Routes.discover()) }
                    )
                }

                composable(
                    route = Routes.TITLE,
                    arguments = listOf(navArgument("id") { type = NavType.StringType })
                ) { entry ->
                    val id = Uri.decode(entry.arguments?.getString("id") ?: "")
                    TitleScreen(
                        workId = id,
                        viewModel = viewModel,
                        onBackToDiscover = { navigateTop(Routes.discover()) },
                        onOpenWork = { navController.navigate(Routes.title(it)) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) },
                        onOpenDiscoverTag = { tag ->
                            navController.navigate(Routes.discover(q = tag, scope = "curated"))
                        },
                        onOpenLists = { navigateTop(Routes.LISTS) }
                    )
                }

                composable(Routes.PARTNER_ROOM) {
                    PartnerRoomScreen(
                        viewModel = viewModel,
                        onBackHome = { navigateTop(Routes.HOME) },
                        onOpenWork = { navController.navigate(Routes.title(it)) }
                    )
                }

                composable(Routes.CHAT) {
                    ChatScreen(
                        viewModel = viewModel,
                        onOpenWork = { navController.navigate(Routes.title(it)) },
                        onOpenCreator = { navController.navigate(Routes.creatorDetail(it)) },
                        onOpenListDetail = { navController.navigate(Routes.listDetail(it)) }
                    )
                }

                composable(Routes.SETTINGS) {
                    SettingsScreen(
                        viewModel = viewModel,
                        onBackToProfile = { navigateTop(Routes.PROFILE) },
                        onSignedOut = {
                            navController.navigate(Routes.AUTH) {
                                popUpTo(0) { inclusive = true }
                            }
                        }
                    )
                }
            }
        }

        // Global Modals & Overlays
        state.logTarget?.let { target ->
            val work = viewModel.getWork(target.workId)
            if (work != null && account != null) {
                val existing = target.logId?.let { id -> account.logs.firstOrNull { it.id == id } }
                LogEditorDialog(
                    work = work,
                    existing = existing,
                    onDismiss = { viewModel.closeLog() },
                    onSave = { log -> viewModel.saveLog(log, existing != null) },
                    onDelete = existing?.let { { viewModel.deleteLog(it.id) } }
                )
            } else {
                viewModel.closeLog()
            }
        }

        if (formatOpen) {
            FormatSwitcherDialog(
                catalog = viewModel.catalogRepo.catalog,
                onSelectMedium = { navigateTop(Routes.discover(medium = it)) },
                onDismiss = { formatOpen = false }
            )
        }
        if (notificationsOpen) {
            NotificationsDialog(onDismiss = { notificationsOpen = false })
        }
        if (helpOpen) {
            OrientationHelpDialog(onDismiss = { helpOpen = false })
        }
        if (quickLogOpen) {
            QuickLogDialog(
                works = viewModel.knownWorks(),
                onSelectWork = { viewModel.openLog(it) },
                onDismiss = { quickLogOpen = false }
            )
        }

        // Animated Toast Banner
        AnimatedVisibility(
            visible = state.toast.isNotEmpty(),
            enter = fadeIn(),
            exit = fadeOut(),
            modifier = Modifier
                .align(Alignment.BottomCenter)
                .navigationBarsPadding()
                .padding(horizontal = 20.dp, vertical = if (showChrome) 86.dp else 24.dp)
        ) {
            Surface(
                shape = RoundedCornerShape(999.dp),
                color = DistranColors.Raised,
                border = BorderStroke(1.dp, DistranColors.Green.copy(alpha = 0.55f))
            ) {
                Text(
                    text = state.toast,
                    fontFamily = AbelFontFamily,
                    fontSize = 14.sp,
                    color = DistranColors.Ink,
                    modifier = Modifier.padding(horizontal = 18.dp, vertical = 10.dp)
                )
            }
        }
    }
}

@Composable
private fun DistranTopBar(
    currentRoute: String,
    onHome: () -> Unit,
    onOpenFormats: () -> Unit,
    onOpenSearch: () -> Unit,
    onOpenNotifications: () -> Unit,
    onOpenSettings: () -> Unit,
    onQuickLog: () -> Unit,
    onOpenHelp: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xF0070708))
            .statusBarsPadding()
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 10.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                DistranWordmark(onClick = onHome)
                val badge = when {
                    currentRoute.startsWith("discover") -> "DISCOVER"
                    currentRoute.startsWith("lists") -> "LISTS"
                    currentRoute.startsWith("creators") -> "CREATORS"
                    currentRoute.startsWith("profile") -> "PROFILE"
                    currentRoute.startsWith("chat") -> "FRIENDS"
                    currentRoute.startsWith("settings") -> "SETTINGS"
                    currentRoute.startsWith("title") -> "TITLE"
                    currentRoute.startsWith("room") -> "ROOM"
                    else -> "PREVIEW"
                }
                Box(
                    modifier = Modifier
                        .border(1.dp, DistranColors.Line, RoundedCornerShape(4.dp))
                        .padding(horizontal = 6.dp, vertical = 2.dp)
                ) {
                    Text(badge, fontFamily = DmMonoFontFamily, fontSize = 7.sp, color = DistranColors.Green)
                }
            }

            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(2.dp)
            ) {
                IconButton(onClick = onOpenFormats, modifier = Modifier.size(34.dp)) {
                    Icon(
                        Icons.Outlined.Layers,
                        contentDescription = "Switch format",
                        tint = DistranColors.InkSoft,
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onOpenSearch, modifier = Modifier.size(34.dp)) {
                    Icon(
                        Icons.Outlined.Search,
                        contentDescription = "Discover search",
                        tint = DistranColors.InkSoft,
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onOpenNotifications, modifier = Modifier.size(34.dp)) {
                    Icon(
                        Icons.Outlined.Notifications,
                        contentDescription = "Notifications",
                        tint = DistranColors.InkSoft,
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onOpenSettings, modifier = Modifier.size(34.dp)) {
                    Icon(
                        Icons.Outlined.Settings,
                        contentDescription = "Settings",
                        tint = DistranColors.InkSoft,
                        modifier = Modifier.size(18.dp)
                    )
                }
                IconButton(onClick = onOpenHelp, modifier = Modifier.size(34.dp)) {
                    Icon(
                        Icons.AutoMirrored.Outlined.HelpOutline,
                        contentDescription = "Welcome guide",
                        tint = DistranColors.InkSoft,
                        modifier = Modifier.size(18.dp)
                    )
                }
                Spacer(Modifier.width(4.dp))
                Box(
                    modifier = Modifier
                        .size(34.dp)
                        .clip(CircleShape)
                        .background(DistranColors.Ink)
                        .clickable(onClick = onQuickLog),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        Icons.Outlined.Add,
                        contentDescription = "Quick log",
                        tint = DistranColors.GreenDark,
                        modifier = Modifier.size(18.dp)
                    )
                }
            }
        }
        HorizontalDivider(color = DistranColors.Line)
    }
}

@Composable
private fun DistranBottomBar(
    currentRoute: String,
    onNavigate: (String) -> Unit
) {
    val items = listOf(
        BottomNavItem("Home", "home", Routes.HOME, Icons.Outlined.Home),
        BottomNavItem("Discover", "discover", Routes.discover(), Icons.Outlined.CompassCalibration),
        BottomNavItem("Lists", "lists", Routes.LISTS, Icons.AutoMirrored.Outlined.FormatListBulleted),
        BottomNavItem("Friends", "chat", Routes.CHAT, Icons.Outlined.ChatBubbleOutline),
        BottomNavItem("Profile", "profile", Routes.PROFILE, Icons.Outlined.Person)
    )
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .background(Color(0xF5070708))
            .navigationBarsPadding()
    ) {
        HorizontalDivider(color = DistranColors.Line)
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 6.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.SpaceAround,
            verticalAlignment = Alignment.CenterVertically
        ) {
            items.forEach { item ->
                val active = currentRoute.startsWith(item.baseRoute)
                Column(
                    modifier = Modifier
                        .clip(RoundedCornerShape(10.dp))
                        .clickable { onNavigate(item.targetRoute) }
                        .padding(horizontal = 12.dp, vertical = 4.dp),
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(3.dp)
                ) {
                    Icon(
                        imageVector = item.icon,
                        contentDescription = item.label,
                        tint = if (active) DistranColors.Green else DistranColors.Muted,
                        modifier = Modifier.size(20.dp)
                    )
                    Text(
                        text = item.label.uppercase(),
                        fontFamily = DmMonoFontFamily,
                        fontSize = 8.sp,
                        letterSpacing = 0.6.sp,
                        color = if (active) DistranColors.Ink else DistranColors.Subtle
                    )
                }
            }
        }
    }
}
